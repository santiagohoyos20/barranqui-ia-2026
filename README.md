# barranqui-ia-2026


gestor financiero para empresas pequeñas/medianas. Uso de IA para escaneo de facturas por medio de lectura de archivos y escaneo por camara. Facturas se categorizan automaticamente como gastos o ingresos, y dentro de estas categorias en subcategorias. Además, genera facturas digitales para facíl contabilidad futura

## Base vectorial del banco

Por ahora solo estoy dejando la base de datos vectorial del sitio `bancoserfinanza.com`.

El script vive en [scrapper/build_vector_db.py](scrapper/build_vector_db.py) y hace esto:
- recorre URLs internas del sitio
- extrae texto útil de cada página
- lo divide en fragmentos de 500 a 1000 caracteres
- guarda los embeddings en ChromaDB

### Uso

```powershell
cd scrapper
pip install -r requirements.txt
python build_vector_db.py
```

La base queda guardada en la carpeta `scrapper/vector_db`.