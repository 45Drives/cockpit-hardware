%define        __spec_install_post %{nil}
%define          debug_package %{nil}
%define        __os_install_post %{_dbpath}/brp-compress

Name:		cockpit-45drives-hardware
Version:	1.3.3
Release:	1%{?dist}
Summary:	A cockpit package for 45Drives Storinator Products. 

Group:		Development/Tools
License:	GPL
URL:		https://github.com/45Drives/cockpit-hardware
Source0:	%{name}-%{version}.tar.gz

BuildArch:	x86_64
BuildRoot:	%{_tmppath}/%{name}-%{version}-%{release}-root

Requires: cockpit
Requires: cockpit-ws
Requires: cockpit-bridge
Requires: dmidecode
Requires: ipmitool
Requires: python3
Requires: lshw
Requires: 45drives-tools >= 1.8.6


Obsoletes: 45drives-cockpit-hardware
Provides: 45drives-cockpit-hardware
Conflicts: 45drives-cockpit-hardware

Obsoletes: cockpit-hardware
Provides: cockpit-hardware
Conflicts: cockpit-hardware

%description
A cockpit package for 45Drives Storinator Products.

%prep
%setup -q

%build
# empty

%install
rm -rf %{buildroot}
mkdir -p %{buildroot}

# in builddir
cp -a usr/ %{buildroot}

%clean
rm -rf %{buildroot}

%files
%dir /usr/share/cockpit/45drives-system
%dir /usr/share/cockpit/45drives-disks
%dir /usr/share/cockpit/45drives-motherboard
%defattr(-,root,root,-)
/usr/share/cockpit/45drives-system/*
/usr/share/cockpit/45drives-disks/*
/usr/share/cockpit/45drives-motherboard/*

%changelog
* Thu Mar 25 2021 Mark Hooper <mhooper@45drives.com> 1.3.3-1
- fixed bug for AV15-BASE models caused by ram helper script.
* Tue Mar 09 2021 Mark Hooper <mhooper@45drives.com> 1.3.2-1
- All modules can now be used by users with sudo privelages.
* Mon Mar 08 2021 Mark Hooper <mhooper@45drives.com> 1.3.1-2
- Updated requirements for 45drives-tools version from >= 1.8.5 to >= 1.8.6.
* Mon Mar 08 2021 Mark Hooper <mhooper@45drives.com> 1.3.1-1
- Packaging of cockpit-45drives-hardware now handled using docker.
- Added support for all Enhanced models with AMD processors.
* Thu Feb 25 2021 Mark Hooper <mhooper@45drives.com> 1.3.0-1
- Added support for C8 and Mi4 Server Models.
* Tue Feb 23 2021 Mark Hooper <mhooper@45drives.com> 1.2.1-1
- renamed package from 45drives-cockpit-hardware to cockpit-45drives-hardware.
- updated spec file to nto require the version to be in the path.
* Thu Feb 18 2021 Mark Hooper <mhooper@45drives.com> 1.2.0-2
- Fixed path error in pci helper scripts for 45drives-motherboard and 45drives-system.
* Thu Feb 18 2021 Mark Hooper <mhooper@45drives.com> 1.2.0-1
- Created three seperate modules for cockpit, 45drives-disks, 45drives-system and 45drives-motherboard.
* Thu Jan 28 2021 Mark Hooper <mhooper@45drives.com> 1.1.0-1
- updated this package to require 45drives-tools >= 1.8.0
- This will be the foundation for 45drives-cockpit-hardware going forward.
* Wed Jan 27 2021 Mark Hooper <mhooper@45drives.com> 1.0.3-2
- ensured that provides, obsoletes and conflicts for old package cockpit-hardware are in spec file.
* Fri Jan 22 2021 Mark Hooper <mhooper@45drives.com> 1.0.3-1
- removed the /opt/tools directory and all of its contents. (handled by dependency 45drives-tools)
- updated dependency minimum version to 1.7.5 for 45drives-tools
- changed name of package to 45drives-cockpit-hardware from cockpit-hardware
* Wed Jan 06 2021 Mark Hooper <mhooper@45drives.com> 1.0.2
- Added lshw dependency.
- Added 45drives-tools dependency
* Thu Dec 03 2020 Mark Hooper <mhooper@45drives.com> 1.0.1
- Added support for Intel 4210 CPUs
- Replaced "Legacy" with "Generic" Labels for unidentifiable systems.
- Removed unused scripts from /usr/share/cockpit/hardware/helper_scripts
* Fri Nov 06 2020 Mark Hooper <mhooper@45drives.com> 1.0.0
- First build of 1.0.0
