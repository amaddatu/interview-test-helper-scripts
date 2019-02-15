SQLFILE=backup_$(date "+%Y-%m-%d_%H%M%S").sql
echo "Will attempt to backup to: "$SQLFILE
mysqldump -u $INTERVIEW_MAGENTO_LOGIN -p$INTERVIEW_MAGENTO_LOGIN -h 127.0.0.1 --port 6006 $INTERVIEW_MAGENTO_LOGIN > $SQLFILE
echo $SQLFILE > last_backup.txt
echo "Completed"