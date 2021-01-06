%define        __spec_install_post %{nil}
%define          debug_package %{nil}
%define        __os_install_post %{_dbpath}/brp-compress

Name:		cockpit-hardware
Version:	1.0.2
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
Requires: 45drives-tools


%description
A cockpit package for 45Drives Storinator Products.

%prep
%setup -q

%build
# empty

%install
rm -rf %{buildroot}
mkdir -p %{buildroot}/usr/share/cockpit/hardware/
mkdir -p %{buildroot}/opt/tools/

# in builddir
cp -a usr/share/cockpit/hardware/ %{buildroot}/usr/share/cockpit/
cp -a opt/tools/ %{buildroot}/opt/

%clean
rm -rf %{buildroot}

%files
%dir /usr/share/cockpit/hardware
%defattr(-,root,root,-)
/usr/share/cockpit/hardware/*
%dir /opt/tools
/opt/tools/storcli64

%changelog
* Wed Jan 06 2021 Mark Hooper <mhooper@45drives.com> 1.0.2
- Added lshw dependency.
- Added 45drives-tools dependency
* Thu Dec 03 2020 Mark Hooper <mhooper@45drives.com> 1.0.1
- Added support for Intel 4210 CPUs
- Replaced "Legacy" with "Generic" Labels for unidentifiable systems.
- Removed unused scripts from /usr/share/cockpit/hardware/helper_scripts
* Fri Nov 06 2020 Mark Hooper <mhooper@45drives.com> 1.0.0
- First build of 1.0.0
