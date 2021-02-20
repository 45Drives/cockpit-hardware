all:

install:
	mkdir -p $(DESTDIR)/usr/share/cockpit/45drives-disks
	mkdir -p $(DESTDIR)/usr/share/cockpit/45drives-motherboard
	mkdir -p $(DESTDIR)/usr/share/cockpit/45drives-system
	cp -r src/fakeroot/usr/share/cockpit/45drives-disks/* $(DESTDIR)/usr/share/cockpit/45drives-disks
	cp -r src/fakeroot/usr/share/cockpit/45drives-motherboard/* $(DESTDIR)/usr/share/cockpit/45drives-motherboard
	cp -r src/fakeroot/usr/share/cockpit/45drives-system/* $(DESTDIR)/usr/share/cockpit/45drives-system

uninstall:
	rm -rf $(DESTDIR)/usr/share/cockpit/45drives-disks
	rm -rf $(DESTDIR)/usr/share/cockpit/45drives-motherboard
	rm -rf $(DESTDIR)/usr/share/cockpit/45drives-system