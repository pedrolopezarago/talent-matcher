"""Print the parquet schema, two example rows and key distinct counts."""
import json
import sys
from collections import Counter

import pyarrow.parquet as pq

path = sys.argv[1] if len(sys.argv) > 1 else "profiles.parquet"
pf = pq.ParquetFile(path)
print("rows:", pf.metadata.num_rows)
print(pf.schema_arrow)
t = pf.read_row_group(0)
for row in t.slice(0, 2).to_pylist():
    print(json.dumps(row, ensure_ascii=False, default=str, indent=1)[:4000])
full = pq.read_table(path, columns=[c for c in ("disponibilidad", "rol", "area") if c in pf.schema_arrow.names])
for c in full.column_names:
    cnt = Counter(full[c].to_pylist())
    print(c, len(cnt), cnt.most_common(5))
