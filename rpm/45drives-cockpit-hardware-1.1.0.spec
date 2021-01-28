%define        __spec_install_post %{nil}
%define          debug_package %{nil}
%define        __os_install_post %{_dbpath}/brp-compress

Name:		45drives-cockpit-hardware
Version:	1.1.0
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
Requires: 45drives-tools >= 1.8.0

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
%dir /usr/share/cockpit/hardware
%defattr(-,root,root,-)
/usr/share/cockpit/hardware/*

%changelog
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
