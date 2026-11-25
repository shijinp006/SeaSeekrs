#!/bin/sh
# `prisma migrate dev` tries migrations out in a database of its own, which the app's user has to be able to make.
# Run once, when the data volume is empty.
mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "GRANT ALL ON \`prisma\_migrate\_shadow\_db%\`.* TO '$MYSQL_USER'@'%';"
