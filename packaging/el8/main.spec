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
* Fri Aug 20 2021 Mark Hooper <mhooper@45drives.com> 2.0.0-1
- added auto packaging for Ubuntu, Rocky and CentOS7