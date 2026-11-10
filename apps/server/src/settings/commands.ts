// 관리자 설정 변경을 검증하고 이전 값과 변경자를 함께 기록합니다.
import { datePlusDays, DomainError, SLOT_TIMES, validateOperationsPolicy } from '@manspick/domain';
import type { Actor, OperationsSettingsDTO } from '@manspick/contracts';
import { auditStatement } from '../activity/audit.ts';
import { batch, first, statement } from '../database/statements.ts';
import { requiredText } from '../http/input.ts';
import type { Env } from '../runtime/env.ts';
import { id } from '../security/crypto.ts';
import { administrator } from '../security/permissions.ts';
import { validatePreparation } from '../shoots/commands/workspace.ts';
import { settings } from './queries.ts';
import { integerValue, objectValue, optionalText, safeUrl, settingValue } from './values.ts';
import { addonRules, catalogRuleStatements, packageRules } from '../booking/catalog-rules.ts';
import type { CatalogRules } from '../booking/catalog-rules.ts';
import { releaseExpiredHolds } from '../booking/holds.ts';
import { conflictingReservations } from '../booking/reservations.ts';

export async function updateSettings(env: Env, actor: Actor, body: Record<string, unknown>) {
  administrator(actor);
  const type = requiredText(body, 'type', 80);
  const settingKey = type === 'neighborhood' ? 'neighborhoods' : type;
  const snapshot = await settingValue<unknown>(env, settingKey, null);
  const catalogSnapshot = ['package', 'addon'].includes(type)
    ? await settingValue<CatalogRules | null>(env, 'catalog_rules', null)
    : null;
  const current = await settings(env, actor);
  const statements: D1PreparedStatement[] = [];
  let next: unknown;
  let previous: unknown = null;
  switch (type) {
    case 'operations_policy': {
      next = validateOperationsPolicy(body.value);
      previous = current.policy;
      break;
    }
    case 'payment_instructions': {
      const data = objectValue(body.value);
      next = {
        bankName: requiredText(data, 'bankName', 100),
        accountNumber: requiredText(data, 'accountNumber', 100),
        accountHolder: requiredText(data, 'accountHolder', 100),
      };
      previous = current.paymentInstructions;
      break;
    }
    case 'neighborhood': {
      const data = objectValue(body.value);
      const value: OperationsSettingsDTO['neighborhoods'][number] = {
        id: requiredText(data, 'id', 80),
        name: requiredText(data, 'name', 100),
        meetingPlace: requiredText(data, 'meetingPlace', 300),
        mapUrl: safeUrl(data.mapUrl),
        parkingNote: optionalText(data.parkingNote),
        parkingUrl: safeUrl(data.parkingUrl),
        hairPlace: optionalText(data.hairPlace, 300),
        hairMapUrl: safeUrl(data.hairMapUrl),
        curriculum: optionalText(data.curriculum),
        active: data.active === true,
      };
      const places = [...current.neighborhoods.filter((place) => place.id !== value.id), value];
      next = places;
      previous = current.neighborhoods;
      statements.push(
        statement(
          env,
          'INSERT INTO neighborhoods(id,name,meeting_point) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,meeting_point=excluded.meeting_point',
          value.id,
          value.name,
          value.meetingPlace,
        ),
      );
      break;
    }
    case 'preparation_guides': {
      const validated = validatePreparation({
        location: { area: '설정 검증', meetingPlace: '설정 검증' },
        guides: body.guides,
      });
      next = validated.guides;
      previous = current.preparationGuides;
      break;
    }
    case 'day_off': {
      const person = requiredText(body, 'directorId', 100);
      const date = requiredText(body, 'date', 10);
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        Number.isNaN(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date
      )
        throw new DomainError('INVALID_DATE', '휴무 날짜를 확인해주세요.');
      if (
        !(await first(
          env,
          "SELECT id FROM staff WHERE id=? AND role='director' AND active=1",
          person,
        ))
      )
        throw new DomainError('INVALID_ASSIGNEE', '디렉터를 확인해주세요.');
      if (typeof body.unavailable !== 'boolean')
        throw new DomainError('INVALID_INPUT', '휴무 여부를 확인해주세요.');
      if (body.unavailable) {
        const conflicts = conflictingReservations(person, date, [...SLOT_TIMES], {
          startsAt: `${date}T00:00:00+09:00`,
          endsAt: `${datePlusDays(date, 1)}T00:00:00+09:00`,
        });
        await releaseExpiredHolds(env, new Date().toISOString(), conflicts);
        const conflictsQuery = `SELECT s.id FROM shoots s WHERE ${conflicts.sql}`;
        if (await first(env, `${conflictsQuery} LIMIT 1`, ...conflicts.values))
          throw new DomainError('DAY_OCCUPIED', '예약된 촬영을 먼저 재배정해주세요.', 409);
        const guard = id();
        statements.push(
          statement(
            env,
            `INSERT INTO mutation_guards(id,ok) SELECT ?,CASE WHEN NOT EXISTS(${conflictsQuery}) THEN 1 ELSE 0 END`,
            guard,
            ...conflicts.values,
          ),
        );
        statements.push(
          statement(
            env,
            'INSERT INTO director_days_off(director_id,date) VALUES(?,?) ON CONFLICT DO NOTHING',
            person,
            date,
          ),
        );
        statements.push(statement(env, 'DELETE FROM mutation_guards WHERE id=?', guard));
      } else
        statements.push(
          statement(
            env,
            'DELETE FROM director_days_off WHERE director_id=? AND date=?',
            person,
            date,
          ),
        );
      next = { directorId: person, date, unavailable: body.unavailable };
      previous = current.daysOff;
      break;
    }
    case 'package': {
      const data = objectValue(body.value);
      const packageId = requiredText(data, 'id', 80);
      if (!current.packages.some((pack) => pack.id === packageId))
        throw new DomainError('INVALID_PACKAGE', '기존 패키지를 선택해주세요.');
      if (data.active !== undefined && typeof data.active !== 'boolean')
        throw new DomainError('INVALID_INPUT', '상품 노출 여부를 확인해주세요.');
      const value = {
        id: packageId,
        ...packageRules(
          data,
          current.packages.find((pack) => pack.id === packageId)!,
          current.packages,
        ),
        name: requiredText(data, 'name', 100),
        price: integerValue(data.price),
        originalPrice: integerValue(data.originalPrice),
        duration: integerValue(data.duration, 1440),
        outfits: integerValue(data.outfits, 20),
        retouchCount: integerValue(data.retouchCount, 100),
        description: requiredText(data, 'description', 2000),
        active:
          typeof data.active === 'boolean'
            ? data.active
            : current.packages.find((pack) => pack.id === packageId)!.active,
      };
      if (!value.duration || !value.outfits || !value.retouchCount)
        throw new DomainError('INVALID_INPUT', '시간·의상·보정 수는 1 이상이어야 합니다.');
      statements.push(
        statement(
          env,
          'UPDATE packages SET name=?,price=?,original_price=?,duration=?,outfits=?,retouch_count=?,description=?,active=? WHERE id=?',
          value.name,
          value.price,
          value.originalPrice,
          value.duration,
          value.outfits,
          value.retouchCount,
          value.description,
          value.active ? 1 : 0,
          value.id,
        ),
      );
      previous = current.packages.find((pack) => pack.id === packageId);
      statements.push(...catalogRuleStatements(env, 'packages', packageId, value, catalogSnapshot));
      next = value;
      break;
    }
    case 'addon': {
      const data = objectValue(body.value);
      const addonId = requiredText(data, 'id', 80);
      if (data.active !== undefined && typeof data.active !== 'boolean')
        throw new DomainError('INVALID_INPUT', '옵션 노출 여부를 확인해주세요.');
      const value = {
        id: addonId,
        ...addonRules(
          data,
          current.addons.find((addon) => addon.id === addonId) ?? {
            id: addonId,
            name: '',
            price: 0,
            description: '',
            maxQuantity: integerValue(data.maxQuantity, data.quantityMode === 'photo' ? 100 : 20),
            active: true,
          },
          current.packages,
        ),
        name: requiredText(data, 'name', 100),
        price: integerValue(data.price),
        description: requiredText(data, 'description', 2000),
        maxQuantity: integerValue(
          data.maxQuantity,
          data.quantityMode === 'photo' || addonId === 'extra_retouch' ? 100 : 20,
        ),
        active:
          typeof data.active === 'boolean'
            ? data.active
            : (current.addons.find((addon) => addon.id === addonId)?.active ?? true),
      };
      if (!value.maxQuantity)
        throw new DomainError('INVALID_INPUT', '최대 수량은 1 이상이어야 합니다.');
      statements.push(
        statement(
          env,
          'INSERT INTO addons(id,name,price,description,max_quantity,active) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,price=excluded.price,description=excluded.description,max_quantity=excluded.max_quantity,active=excluded.active',
          value.id,
          value.name,
          value.price,
          value.description,
          value.maxQuantity,
          value.active ? 1 : 0,
        ),
      );
      previous = current.addons.find((addon) => addon.id === addonId) ?? null;
      statements.push(...catalogRuleStatements(env, 'addons', addonId, value, catalogSnapshot));
      next = value;
      break;
    }
    case 'campaign': {
      const data = objectValue(body.value);
      const value = {
        id: requiredText(data, 'id', 80),
        name: requiredText(data, 'name', 200),
        amount: integerValue(data.amount),
        active: data.active === 1 ? 1 : 0,
      };
      statements.push(
        statement(
          env,
          'INSERT INTO campaigns(id,name,amount,active) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,amount=excluded.amount,active=excluded.active',
          value.id,
          value.name,
          value.amount,
          value.active,
        ),
      );
      previous = current.campaigns.find((campaign) => campaign.id === value.id) ?? null;
      next = value;
      break;
    }
    case 'director_skills': {
      const directorId = requiredText(body, 'directorId', 100);
      if (
        !current.staff.some(
          (person) => person.id === directorId && person.role === 'director' && person.active === 1,
        )
      )
        throw new DomainError('INVALID_ASSIGNEE', '활성 디렉터를 선택해주세요.');
      if (
        !Array.isArray(body.addonIds) ||
        body.addonIds.some(
          (addonId) =>
            typeof addonId !== 'string' ||
            !current.addons.some((addon) => addon.id === addonId && addon.active),
        ) ||
        new Set(body.addonIds).size !== body.addonIds.length
      )
        throw new DomainError('INVALID_ADDONS', '수행할 수 있는 옵션을 중복 없이 선택해주세요.');
      const addonIds = body.addonIds as string[];
      statements.push(
        statement(env, 'DELETE FROM director_skills WHERE director_id=?', directorId),
      );
      for (const addonId of addonIds)
        statements.push(
          statement(
            env,
            'INSERT INTO director_skills(director_id,addon_id) VALUES(?,?)',
            directorId,
            addonId,
          ),
        );
      previous = current.directorSkills.filter((skill) => skill.directorId === directorId);
      next = { directorId, addonIds };
      break;
    }
    case 'retoucher_rules': {
      if (!Array.isArray(body.rules) || body.rules.length !== 7)
        throw new DomainError('INVALID_RULES', '일요일부터 토요일까지 담당자를 모두 지정해주세요.');
      const rules = body.rules.map((item) => {
        const rule = objectValue(item);
        const weekday = integerValue(rule.weekday, 6);
        const retoucherId = requiredText(rule, 'retoucherId', 100);
        if (
          !current.staff.some(
            (person) =>
              person.id === retoucherId && person.role === 'retoucher' && person.active === 1,
          )
        )
          throw new DomainError('INVALID_ASSIGNEE', '활성 보정가를 선택해주세요.');
        return { weekday, retoucherId };
      });
      if (new Set(rules.map((rule) => rule.weekday)).size !== 7)
        throw new DomainError('INVALID_RULES', '요일별 담당자는 하나씩 지정해주세요.');
      // 배정 중인 작업은 유지하고 이후 생성하는 보정 작업의 기준만 바꿉니다.
      for (const rule of rules)
        statements.push(
          statement(
            env,
            'INSERT INTO retoucher_rules(weekday,retoucher_id) VALUES(?,?) ON CONFLICT(weekday) DO UPDATE SET retoucher_id=excluded.retoucher_id',
            rule.weekday,
            rule.retoucherId,
          ),
        );
      previous = current.retoucherRules;
      next = rules;
      break;
    }
    default:
      throw new DomainError('UNKNOWN_ACTION', '지원하지 않는 설정입니다.');
  }
  if (
    ['payment_instructions', 'neighborhood', 'preparation_guides', 'operations_policy'].includes(
      type,
    )
  )
    statements.push(
      statement(
        env,
        'INSERT INTO settings(key,value_json) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json',
        settingKey,
        JSON.stringify(next),
      ),
    );
  statements.push(
    auditStatement(env, actor, {
      action: 'update',
      targetType: 'setting',
      targetId: settingKey,
      previous,
      next,
    }),
  );
  // 설정을 읽은 후 다른 관리자가 먼저 변경했다면 덮어쓰지 않습니다.
  if (
    ['payment_instructions', 'neighborhood', 'preparation_guides', 'operations_policy'].includes(
      type,
    )
  ) {
    const guard = id();
    statements.unshift(
      statement(
        env,
        "INSERT INTO mutation_guards(id,ok) SELECT ?,CASE WHEN COALESCE((SELECT value_json FROM settings WHERE key=?),'null')=? THEN 1 ELSE 0 END",
        guard,
        settingKey,
        JSON.stringify(snapshot),
      ),
    );
    statements.push(statement(env, 'DELETE FROM mutation_guards WHERE id=?', guard));
  }
  await batch(env, statements);
  return settings(env, actor);
}
