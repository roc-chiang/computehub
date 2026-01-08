import sqlite3

conn = sqlite3.connect('test.db')
cursor = conn.cursor()

cursor.execute('SELECT id, name, category FROM deployment_template LIMIT 5')
print('Templates in database:')
for row in cursor.fetchall():
    print(f'  ID: {row[0]}, Name: {row[1]}, Category: "{row[2]}"')

conn.close()
