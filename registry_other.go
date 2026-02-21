//go:build !windows

package main

func tryRefreshWindowsRegistryPath() error { return nil }
