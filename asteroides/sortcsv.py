import pandas as pd

df1 = pd.read_csv('asteroids150km.csv')
df1_sorted = df1.sort_values(by='diameter', ascending=False)
df1_sorted.to_csv('asteroids_ordenado.csv', index=False)

df2 = pd.read_csv('comets5km.csv')
df2_sorted = df2.sort_values(by='diameter', ascending=False)
df2_sorted.to_csv('comets_ordenado.csv', index=False)