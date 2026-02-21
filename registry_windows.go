//go:build windows

package main

import (
	"os"
	"strings"

	"golang.org/x/sys/windows/registry"
)

func tryRefreshWindowsRegistryPath() error {
	var paths []string
	sysKey, err := registry.OpenKey(registry.LOCAL_MACHINE, `SYSTEM\CurrentControlSet\Control\Session Manager\Environment`, registry.QUERY_VALUE)
	if err == nil {
		defer sysKey.Close()
		if sysPath, _, err := sysKey.GetStringValue("Path"); err == nil {
			paths = append(paths, sysPath)
		}
	}
	userKey, err := registry.OpenKey(registry.CURRENT_USER, `Environment`, registry.QUERY_VALUE)
	if err == nil {
		defer userKey.Close()
		if userPath, _, err := userKey.GetStringValue("PATH"); err == nil {
			paths = append(paths, userPath)
		}
	}
	if len(paths) > 0 {
		os.Setenv("PATH", strings.Join(paths, ";")+";"+os.Getenv("PATH"))
	}
	return nil
}
