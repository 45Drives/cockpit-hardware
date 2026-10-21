## cockpit-45drives-hardware 2.8.10-1

* Fix firmware check and flash downloads behind TLS-inspection firewalls on Python 3.13
* Firmware check no longer silently falls back to a stale local manifest; failures now fail the service and show a warning in Cockpit
* Block flashing Broadcom NICs that report an unhealthy state