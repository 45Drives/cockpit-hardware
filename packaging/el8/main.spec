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
%defattr(-,root,root,-)
/usr/share/cockpit/45drives-disks/*
/usr/share/cockpit/45drives-motherboard/*
/usr/share/cockpit/45drives-system/*

%changelog
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