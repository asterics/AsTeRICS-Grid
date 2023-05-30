FROM couchdb:3.3.1

COPY ./couchdb/conf/local.ini /opt/couchdb/etc/
COPY ./couchdb/conf/vm.args /opt/couchdb/etc/
COPY ./couchdb/conf/100-couchdb.conf /etc/security/limits.d/
