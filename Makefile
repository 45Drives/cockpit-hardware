all:

install:
	mkdir -p $(DESTDIR)/usr/share/cockpit/45drives-{disks,motherboard,system}
	cp -r src/fakeroot/usr/share/cockpit/45drives-disks/* $(DESTDIR)/usr/share/cockpit/45drives-disks
	cp -r src/fakeroot/usr/share/cockpit/45drives-motherboard/* $(DESTDIR)/usr/share/cockpit/45drives-motherboard
	cp -r src/fakeroot/usr/share/cockpit/45drives-system/* $(DESTDIR)/usr/share/cockpit/45drives-system

uninstall:
	rm -rf $(DESTDIR)/usr/share/cockpit/45drives-{disks,motherboard,system}