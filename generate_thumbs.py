"""
Gera thumbnails para todas as imagens da galeria.
Saída: assets/thumbs/<categoria>/<arquivo>.jpg  (JPEG)
       assets/thumbs/<categoria>/<arquivo>.png  (PNG — fontes PNG com transparência)
Tamanho: 900px na dimensão maior, qualidade JPEG 85
"""
from PIL import Image
import os, sys

BASE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(BASE, 'assets')
THUMBS_ROOT = os.path.join(ASSETS, 'thumbs')
THUMB_SIZE = (900, 900)
JPEG_QUALITY = 85

# Passa --force para sobrescrever thumbs já existentes
FORCE = '--force' in sys.argv

# (pasta_fonte, pasta_destino_em_thumbs)
FOLDERS = [
    ('fachada',                                    'fachada'),
    ('lazer',                                      'lazer'),
    ('torre corporativa',                          'torre-corporativa'),
    ('torre office',                               'torre-office'),
    ('torre residencial',                          'torre-residencial'),
    (os.path.join('plantas', 'gerais'),            os.path.join('plantas', 'gerais')),
    (os.path.join('plantas', 'apartamentos'),      os.path.join('plantas', 'apartamentos')),
    (os.path.join('plantas', 'duplex'),            os.path.join('plantas', 'duplex')),
]

created = 0
skipped = 0

for src_folder, thumb_folder in FOLDERS:
    src_dir   = os.path.join(ASSETS, src_folder)
    thumb_dir = os.path.join(THUMBS_ROOT, thumb_folder)
    os.makedirs(thumb_dir, exist_ok=True)

    if not os.path.isdir(src_dir):
        print(f'[SKIP] pasta não encontrada: {src_dir}')
        continue

    for fname in os.listdir(src_dir):
        ext = os.path.splitext(fname)[1].lower()
        if ext not in ('.jpg', '.jpeg', '.png', '.webp'):
            continue

        src_path = os.path.join(src_dir, fname)

        # Corrige extensão dupla ex: "ARQUIVO.jpg.jpg" → stem "ARQUIVO"
        stem = os.path.splitext(fname)[0]
        if os.path.splitext(stem)[1].lower() in ('.jpg', '.jpeg', '.png', '.webp'):
            stem = os.path.splitext(stem)[0]

        # PNGs com canal alfa ou modo P → salva como PNG para preservar transparência
        # Outros → salva como JPEG
        is_png_source = ext == '.png'
        if is_png_source:
            try:
                with Image.open(src_path) as probe:
                    has_alpha = probe.mode in ('RGBA', 'LA', 'PA', 'P')
            except Exception:
                has_alpha = False
        else:
            has_alpha = False

        if is_png_source and has_alpha:
            thumb_name = stem + '.png'
            save_as    = 'PNG'
        else:
            thumb_name = stem + '.jpg'
            save_as    = 'JPEG'

        thumb_path = os.path.join(thumb_dir, thumb_name)

        if not FORCE and os.path.exists(thumb_path):
            skipped += 1
            continue

        try:
            with Image.open(src_path) as img:
                if save_as == 'JPEG':
                    img = img.convert('RGB')
                    img.thumbnail(THUMB_SIZE, Image.LANCZOS)
                    img.save(thumb_path, 'JPEG', quality=JPEG_QUALITY, optimize=True)
                else:
                    # Preserva transparência, remove metadados desnecessários
                    if img.mode not in ('RGBA', 'LA'):
                        img = img.convert('RGBA')
                    img.thumbnail(THUMB_SIZE, Image.LANCZOS)
                    img.save(thumb_path, 'PNG', optimize=True)

                orig_kb  = os.path.getsize(src_path) // 1024
                thumb_kb = os.path.getsize(thumb_path) // 1024
                print(f'  {src_folder}/{fname}  [{save_as}]  {orig_kb}KB → {thumb_kb}KB')
                created += 1
        except Exception as e:
            print(f'[ERRO] {src_path}: {e}', file=sys.stderr)

print(f'\nCriados: {created}  |  Já existiam: {skipped}')
