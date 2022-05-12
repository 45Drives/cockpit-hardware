Name: ::package_name::
Version: ::package_version::
Release: ::package_build_version::%{?dist}
Summary: ::package_description_short::
License: ::package_licence::
URL: ::package_url::
Source0: %{name}-%{version}.tar.gz
BuildArch: ::package_architecture_el::
Requires: ::package_dependencies_el::

BuildRoot: %{_tmppath}/%{name}-%{version}-%{release}-root

Obsoletes: 45drives-cockpit-hardware
Provides: 45drives-cockpit-hardware
Conflicts: 45drives-cockpit-hardware

Obsoletes: cockpit-hardware
Provides: cockpit-hardware
Conflicts: cockpit-hardware

%description
::package_title::
::package_description_long::

%prep
%setup -q

%build

%install
make DESTDIR=%{buildroot} install

%files
%dir /usr/share/cockpit/45drives-system
%dir /usr/share/cockpit/45drives-disks
%dir /usr/share/cockpit/45drives-motherboard
/usr/lib/udev/rules.d/68-cockpit-45drives-disks.rules
%defattr(-,root,root,-)
/usr/share/cockpit/45drives-disks/*
/usr/share/cockpit/45drives-motherboard/*
/usr/share/cockpit/45drives-system/*
/usr/lib/udev/rules.d/68-cockpit-45drives-disks.rules

%changelog
* Thu May 12 2022 Mark Hooper <mhooper@45drives.com> 2.1.0-12
- added notifications
* Tue May 10 2022 Mark Hooper <mhooper@45drives.com> 2.1.0-11
- updated build number manually
* Tue May 10 2022 Mark Hooper <mhooper@45drives.com> 2.1.0-10
- updated makefile
* Tue May 10 2022 Mark Hooper <mhooper@45drives.com> 2.1.0-9
- updated makefile
* Tue May 10 2022 Mark Hooper <mhooper@45drives.com> 2.1.0-8
- updated makefile because the ubuntu container uses dash as its default shell
* Tue May 10 2022 Mark Hooper <mhooper@45drives.com> 2.1.0-7
- 8th build
* Mon May 09 2022 Mark Hooper <mhooper@45drives.com> 2.1.0-6
- 6th build, added more flags
- 7th build, passed a --no-parallel flag to dh make because yarn is trash
* Mon May 09 2022 Mark Hooper <mhooper@45drives.com> 2.1.0-5
- 5th build, added network concurrency flag to make file
* Mon May 09 2022 Mark Hooper <mhooper@45drives.com> 2.1.0-4
- fourth build, tried initializing with a yarn.lock file in each subdir
* Mon May 09 2022 Mark Hooper <mhooper@45drives.com> 2.1.0-3
- third build
* Mon May 09 2022 Mark Hooper <mhooper@45drives.com> 2.1.0-2
- second build using autopackaging
* Mon May 09 2022 Mark Hooper <mhooper@45drives.com> 2.1.0-1
- first build of cockpit-45drives-hardware using vue.js
* Wed Feb 23 2022 Mark Hooper <mhooper@45drives.com> 2.0.3-2
- releasing 2.0.3-2 on 45drives stable repo
- added support for 2U Stornado
- added disk images for Toshiba HDDs, Seagate Nytro SAS and Micron 5300 ssds
- Updated H11SSL-i motherboard background assets
* Wed Feb 16 2022 Mark Hooper <mhooper@45drives.com> 2.0.3-1
- Added support for 2U Stornado
- Added disk images for Toshiba HDDs, Seagate Nytro SAS and Micron 5300 drives.
- updated H11SSL-i motherboard background assets
* Fri Dec 10 2021 Mark Hooper <mhooper@45drives.com> 2.0.2-3
- fixed bug in disks module causing 16th drive in hybrid 16 rows to not be displayed
* Tue Nov 16 2021 Mark Hooper <mhooper@45drives.com> 2.0.2-2
- updated helper scripts for 45drives-system and 45drives-motherboard to play nice
  with vms
* Tue Nov 16 2021 Mark Hooper <mhooper@45drives.com> 2.0.2-1
- added support for X11SPi-TF Motherboards in 45drives-motherboard module
- updated assets for X11SPL-F Motherboard
- modified how detected ram is displayed in 45drives-motherboard module
* Mon Aug 23 2021 Mark Hooper <mhooper@45drives.com> 2.0.1-5
- added ipmi lan info section to 45Drives-system module
* Mon Aug 23 2021 Mark Hooper <mhooper@45drives.com> 2.0.1-4
- updated unsupported motherboard message in 45Drives-motherboard module
* Mon Aug 23 2021 Mark Hooper <mhooper@45drives.com> 2.0.1-3
- updated helper scripts to handle virtual machine hardware configurations
* Mon Aug 23 2021 Mark Hooper <mhooper@45drives.com> 2.0.1-2
- updated CSS for 45Drives Disks
* Mon Aug 23 2021 Mark Hooper <mhooper@45drives.com> 2.0.1-1
- added new product keys for Bronze, Silver and Gold Intel CPUs using X11SPL-F Motherboards
- added a placeholder image to 45Drives-system page
- Mouseover popups on motherboard no longer extend below board footprint
- Added Package for Rocky Linux
- updated README.md
* Mon Aug 23 2021 Mark Hooper <mhooper@45drives.com> 2.0.0-5
- updated images used in 45drives-system page
* Fri Aug 20 2021 Mark Hooper <mhooper@45drives.com> 2.0.0-4
- build 3, added require el7 folder
* Fri Aug 20 2021 Mark Hooper <mhooper@45drives.com> 2.0.0-3
- second build, changed deb dependencies format for >= style entry
* Fri Aug 20 2021 Mark Hooper <mhooper@45drives.com> 2.0.0-2
- first build using autopackaging
* Fri Aug 20 2021 Mark Hooper <mhooper@45drives.com> 2.0.0-1
- added auto packaging for Ubuntu, Rocky and CentOS7