# 고정 버전 FontTools로 원본 윤곽과 가변 축을 보존한 OFL 폰트 파생본을 만듭니다.
import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.local' / 'font-tools'))
try:
    import brotli
    import fontTools
    from fontTools import subset
    from fontTools.ttLib import TTFont
    from fontTools.pens.recordingPen import DecomposingRecordingPen
except ImportError as error:
    raise SystemExit('Install tools explicitly: python -m pip install --target .local/font-tools --only-binary=:all: --no-deps fonttools==4.68.0 Brotli==1.2.1') from error


def sha(data):
    return hashlib.sha256(data).hexdigest()


def unicode_range(points):
    ranges = []
    for point in points:
        if ranges and point == ranges[-1][1] + 1:
            ranges[-1][1] = point
        else:
            ranges.append([point, point])
    return ', '.join(f'U+{start:04X}' + (f'-{end:04X}' if start != end else '') for start, end in ranges)


def rename(font, family, source_name):
    # Keep copyright/OFL/designer records intact, but never use the source RFN as the derivative's name.
    replacements = {1: family, 3: family + '-landing-subset-v1', 4: family, 6: family.replace(' ', ''), 16: family, 18: family, 21: family, 25: family.replace(' ', '')}
    for record in font['name'].names:
        if record.nameID in replacements:
            record.string = replacements[record.nameID].encode(record.getEncoding())
        elif record.nameID not in {0, 7, 8, 9, 11, 13, 14}:
            text = record.toUnicode()
            if source_name in text:
                record.string = text.replace(source_name, family).encode(record.getEncoding())


def assert_geometry(original, output, points):
    source_map, output_map = original.getBestCmap(), output.getBestCmap()
    axis = original['fvar'].axes[0]
    weights = sorted({axis.minValue, axis.defaultValue, 400, 700, min(920, axis.maxValue), axis.maxValue})
    for weight in weights:
        source_glyphs = original.getGlyphSet(location={'wght': weight})
        output_glyphs = output.getGlyphSet(location={'wght': weight})
        for point in points:
            source_glyph = source_glyphs[source_map[point]]
            output_glyph = output_glyphs[output_map[point]]
            left, right = DecomposingRecordingPen(source_glyphs), DecomposingRecordingPen(output_glyphs)
            source_glyph.draw(left)
            output_glyph.draw(right)
            if source_glyph.width != output_glyph.width or left.value != right.value:
                raise ValueError(f'Glyph geometry changed at U+{point:04X}, weight {weight}')
    return weights


def generate(config, source, family, filename):
    source_path = ROOT / 'packages/design-system/src/assets/fonts' / source
    original = TTFont(source_path, recalcTimestamp=False)
    font = TTFont(source_path, recalcTimestamp=False)
    points = sorted(set(config['codepoints']) & set(original.getBestCmap()))
    options = subset.Options()
    options.layout_features = ['*']
    options.name_IDs = ['*']
    options.name_languages = ['*']
    options.name_legacy = True
    options.glyph_names = True
    options.recalc_timestamp = False
    options.flavor = 'woff2'
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=points)
    subsetter.subset(font)
    rename(font, family, source.replace('Variable.woff2', ''))
    font.flavor = 'woff2'
    output_path = Path(config['destination']) / filename
    temporary_path = output_path.with_suffix('.tmp.woff2')
    font.save(temporary_path)
    output = TTFont(temporary_path, recalcTimestamp=False)
    if set(output.getBestCmap()) != set(points):
        raise ValueError('Subset cmap does not match requested supported characters')
    for table, fields in {'head': ['unitsPerEm'], 'hhea': ['ascent', 'descent', 'lineGap'], 'OS/2': ['sTypoAscender', 'sTypoDescender', 'sTypoLineGap', 'usWinAscent', 'usWinDescent']}.items():
        for field in fields:
            if getattr(original[table], field) != getattr(output[table], field):
                raise ValueError(f'Font metric changed: {table}.{field}')
    axes = lambda item: [(axis.axisTag, axis.minValue, axis.defaultValue, axis.maxValue) for axis in item['fvar'].axes]
    if axes(original) != axes(output):
        raise ValueError('Variable axes changed')
    checked_weights = assert_geometry(original, output, points)
    weight = output['fvar'].axes[0]
    for record in output['name'].names:
        if record.nameID in {1, 4, 6, 16, 18, 21, 25} and source.replace('Variable.woff2', '') in record.toUnicode():
            raise ValueError('Derivative font uses a source family name')
    output.close()
    temporary_path.replace(output_path)
    data = output_path.read_bytes()
    return {
        'source': source, 'sourceSha256': sha(source_path.read_bytes()),
        'family': family, 'file': filename, 'bytes': len(data), 'sha256': sha(data),
        'codepoints': points, 'unicodeRange': unicode_range(points),
        'glyphCount': len(output.getGlyphOrder()),
        'weightRange': [int(weight.minValue), int(weight.maxValue)],
        'cssWeightRange': [45, 920] if source.startswith('Pretendard') else [100, 900],
        'verifiedOutlineAndAdvanceWeights': checked_weights,
        'license': '../OFL-Pretendard.txt' if source.startswith('Pretendard') else '../OFL-Geist.txt',
    }


config = json.load(sys.stdin)
if fontTools.__version__ != config['versions']['fonttools'] or brotli.__version__ != config['versions']['brotli']:
    raise SystemExit('FontTools/Brotli version differs from the pinned generator versions')
result = [
    generate(config, 'PretendardVariable.woff2', 'Manspick Landing Sans', 'ManspickLandingSans.woff2'),
    generate(config, 'GeistVariable.woff2', 'Manspick Landing Display', 'ManspickLandingDisplay.woff2'),
]
print(json.dumps(result))
