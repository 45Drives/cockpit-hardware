%define        __spec_install_post %{nil}
%define          debug_package %{nil}
%define        __os_install_post %{_dbpath}/brp-compress

Name:		cockpit-hardware
Version:	1.0.0
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
cp -a opt/tools/ %{buildroot}/opt/tools/

%clean
rm -rf %{buildroot}

%files
%dir /usr/share/cockpit/hardware
%defattr(-,root,root,-)
/usr/share/cockpit/hardware/*
%dir /opt/tools
/opt/tools/storcli64

%changelog
* Fri Nov 06 2020 Mark Hooper <mhooper@45drives.com> 1.0.0
- First build of 1.0.0