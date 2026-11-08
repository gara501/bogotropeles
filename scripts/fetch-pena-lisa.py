"""Download the PixelLab-generated collectible illustration."""
from pathlib import Path
from urllib.request import urlopen

url = 'https://api.pixellab.ai/mcp/images/d3216dec-85b8-4f8a-b3f1-16a9941751ce/download?index=0'
target = Path(__file__).resolve().parents[1] / 'src/data/collectibles/pena-lisa-pixellab.png'
with urlopen(url, timeout=35) as response:
    data = response.read()
if not data.startswith(b'\x89PNG\r\n\x1a\n'):
    raise ValueError('PixelLab did not return a PNG')
target.write_bytes(data)
print(f'{target.name}: {len(data)} bytes')
