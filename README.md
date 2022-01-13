
### Running crawler

Required High server load to run

RAM: 4gb or more
CPU: 4cores or more

Run the task
```
node crawler.js
```

Connect to planetscale if you use this
```
pscale connect dbname --port 3309 --execute-protocol=mysql --execute='node crawler.js'
```
