package api

import (
    "fmt"
    "os"
    "path/filepath"
    "strings"
)

// resolvePath joins the given relative path with the static root and ensures
// the final path stays within the static root directory.
func resolvePath(rel string) (string, error) {
    // Gin wildcard params often start with a leading slash. Trim both styles.
    rel = strings.TrimPrefix(rel, "/")
    rel = strings.TrimPrefix(rel, string(os.PathSeparator))

    cleaned := filepath.Clean(rel)
    if cleaned == ".." || strings.HasPrefix(cleaned, ".."+string(os.PathSeparator)) {
        return "", fmt.Errorf("invalid path")
    }

    joined := filepath.Join(staticAbsPath, cleaned)
    abs, err := filepath.Abs(joined)
    if err != nil {
        return "", err
    }

    relToRoot, err := filepath.Rel(staticAbsPath, abs)
    if err != nil || relToRoot == ".." || strings.HasPrefix(relToRoot, ".."+string(os.PathSeparator)) {
        return "", fmt.Errorf("path escapes static root")
    }

    return abs, nil
}

// isSafeName validates a single file or folder name (no separators, no reserved names)
func isSafeName(name string) bool {
    if name == "" || name == "." || name == ".." {
        return false
    }
    if strings.ContainsAny(name, "/\\") {
        return false
    }
    upper := strings.ToUpper(name)
    switch upper {
    case "CON", "PRN", "AUX", "NUL",
        "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
        "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9":
        return false
    }
    return true
}