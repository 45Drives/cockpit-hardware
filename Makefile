all:

install:
	mkdir -p $(DESTDIR)/usr/share/cockpit/45drives-{disks,motherboard,system}
	cp -r src/fakeroot/usr/share/cockpit/45drives-{disks,motherboard,system}/* $(DESTDIR)/usr/share/cockpit/45drives-{disks,motherboard,system}

uninstall:
	rm -rf $(DESTDIR)/usr/share/cockpit/45drives-{disks,motherboard,system}