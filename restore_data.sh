SQLFILE=$(cat last_backup.txt)
echo "Will attempt to restore from: "$SQLFILE
mysql -u $INTERVIEW_MAGENTO_LOGIN -p$INTERVIEW_MAGENTO_LOGIN -h 127.0.0.1 --port 6006 $INTERVIEW_MAGENTO_LOGIN < $SQLFILE
echo "Completed"