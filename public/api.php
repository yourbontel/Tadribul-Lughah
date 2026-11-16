<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$entity = $_GET['entity'] ?? 'materi';
if ($entity === 'program_states' || $entity === 'programs') {
    $storageFile = __DIR__ . '/program_states.json';
} elseif ($entity === 'pekan_unlock' || $entity === 'unlock') {
    $storageFile = __DIR__ . '/pekan_unlock.json';
} elseif ($entity === 'quiz_scores' || $entity === 'quiz') {
    $storageFile = __DIR__ . '/quiz_scores.json';
} elseif ($entity === 'registrations' || $entity === 'pendaftar') {
    $storageFile = __DIR__ . '/registrations.json';
} elseif ($entity === 'attendance' || $entity === 'absensi') {
    $storageFile = __DIR__ . '/attendance.json';
} elseif ($entity === 'attendance_unlock' || $entity === 'attendance_sessions' || $entity === 'absen_unlock') {
    $storageFile = __DIR__ . '/attendance_unlock.json';
} elseif ($entity === 'student_accounts' || $entity === 'accounts' || $entity === 'users') {
    $storageFile = __DIR__ . '/student_accounts.json';
} else {
    $storageFile = __DIR__ . '/custom_materi.json';
}

function extractDriveFileIdPhp($input) {
    $trimmed = trim((string)$input);
    if ($trimmed === '') return '';
    if (preg_match('/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]{10,})/i', $trimmed, $m)) {
        return $m[1];
    }
    if (preg_match('/[?&]id=([a-zA-Z0-9_-]{10,})/i', $trimmed, $m)) {
        return $m[1];
    }
    if (!preg_match('/^https?:\/\//i', $trimmed) && preg_match('/^[a-zA-Z0-9_-]{20,}$/', $trimmed)) {
        return $trimmed;
    }
    return '';
}

function fetchHttpRaw($url, $cookieFile = null, $timeout = 20) {
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        $opts = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        ];
        if ($cookieFile) {
            $opts[CURLOPT_COOKIEJAR] = $cookieFile;
            $opts[CURLOPT_COOKIEFILE] = $cookieFile;
        }
        curl_setopt_array($ch, $opts);
        $body = curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $ctype = (string)curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        $effectiveUrl = (string)curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
        $err = curl_error($ch);
        curl_close($ch);
        return [$code, $body, $ctype, $err, $effectiveUrl];
    }
    $ctx = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => $timeout,
            'ignore_errors' => true,
            'header' => "User-Agent: Mozilla/5.0\r\n"
        ]
    ]);
    $body = @file_get_contents($url, false, $ctx);
    $code = 200;
    if (isset($http_response_header[0]) && preg_match('/HTTP\/\S+\s+(\d+)/', $http_response_header[0], $m)) {
        $code = (int)$m[1];
    }
    return [$code, $body, '', $body === false ? 'Gagal mengambil URL' : '', $url];
}

function isDriveLoginOrDeniedPage($httpCode, $effectiveUrl, $pageTitle) {
    if ($httpCode === 401 || $httpCode === 403) {
        return true;
    }
    if (stripos((string)$effectiveUrl, 'accounts.google.com') !== false) {
        return true;
    }
    $cleanTitle = trim((string)$pageTitle);
    if ($cleanTitle !== '' && preg_match('/^(sign\s*in|google\s+drive:\s*sign-in|meet\s+google\s+drive|google\s+accounts|you\s+need\s+access|request\s+access|minta\s+akses|perlu\s+akses)/i', $cleanTitle)) {
        return true;
    }
    return false;
}

// GET data
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (($_GET['action'] ?? '') === 'drive_video_meta') {
        $rawUrl = trim((string)($_GET['url'] ?? ''));
        $fileId = extractDriveFileIdPhp($rawUrl);
        if ($fileId === '') {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Link atau File ID Google Drive tidak valid"]);
            exit;
        }
        $viewUrl = 'https://drive.google.com/file/d/' . $fileId . '/view?usp=sharing';
        [$httpCode, $html, , $errMsg, $effectiveUrl] = fetchHttpRaw($viewUrl, null, 15);
        if ($html === false || ($httpCode >= 400 && $httpCode !== 401 && $httpCode !== 403)) {
            http_response_code($httpCode >= 400 ? $httpCode : 502);
            echo json_encode(["status" => "error", "message" => "Gagal mengambil info Google Drive: " . $errMsg]);
            exit;
        }
        $title = '';
        if (preg_match('/<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $tm)) {
            $title = $tm[1];
        } elseif (preg_match('/<title[^>]*>(.*?)<\/title>/is', $html, $tm)) {
            $title = $tm[1];
        }
        $title = trim(html_entity_decode($title, ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        $title = preg_replace('/\s*-\s*Google\s+Drive$/iu', '', $title);
        $title = preg_replace('/\.(mp4|mkv|webm|mov|avi|m4v)$/iu', '', trim((string)$title));

        $isLoginWall = isDriveLoginOrDeniedPage($httpCode, $effectiveUrl, $title);
        if ($isLoginWall) {
            $title = '';
        }

        echo json_encode([
            "status" => "ok",
            "fileId" => $fileId,
            "title" => trim((string)$title),
            "isPublicAccessible" => !$isLoginWall
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (($_GET['action'] ?? '') === 'youtube_oembed') {
        $ytUrl = trim((string)($_GET['url'] ?? ''));
        if ($ytUrl === '') {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Parameter url YouTube wajib diisi"]);
            exit;
        }
        $oembedEndpoint = 'https://www.youtube.com/oembed?url=' . urlencode($ytUrl) . '&format=json';
        [$httpCode, $respBody, , $errMsg] = fetchHttpRaw($oembedEndpoint, null, 15);
        if ($respBody === false || $httpCode >= 400) {
            http_response_code($httpCode >= 400 ? $httpCode : 502);
            echo json_encode(["status" => "error", "message" => "Gagal mengambil metadata video YouTube" . ($errMsg ? ": $errMsg" : "")]);
            exit;
        }
        $meta = json_decode($respBody, true);
        echo json_encode([
            "status" => "ok",
            "title" => trim((string)($meta['title'] ?? '')),
            "channel" => trim((string)($meta['author_name'] ?? ''))
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (file_exists($storageFile)) {
        $content = file_get_contents($storageFile);
        echo $content ?: '{}';
    } else {
        echo '{}';
    }
    exit;
}

// POST data (Save from Superadmin or Student) or DELETE
if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);

    $action = $_GET['action'] ?? (is_array($data) ? ($data['action'] ?? '') : '');
    $deleteKey = trim((string)($_GET['key'] ?? $_GET['delete_key'] ?? (is_array($data) ? ($data['key'] ?? $data['registrationNumber'] ?? '') : '')));
    $deleteEmail = trim((string)($_GET['email'] ?? (is_array($data) ? ($data['email'] ?? '') : '')));

    // Handle delete action
    if ($action === 'delete' && (!empty($deleteKey) || !empty($deleteEmail))) {
        $existing = [];
        if (file_exists($storageFile)) {
            $rawExisting = file_get_contents($storageFile);
            $existing = json_decode($rawExisting, true) ?? [];
        }

        $targets = [];
        if (!empty($deleteKey)) {
            $targets[] = $deleteKey;
            $targets[] = strtoupper($deleteKey);
            $targets[] = strtolower($deleteKey);
        }
        if (!empty($deleteEmail)) {
            $targets[] = $deleteEmail;
            $targets[] = strtoupper($deleteEmail);
            $targets[] = strtolower($deleteEmail);
        }
        $targets = array_unique(array_filter($targets));

        $deleted = false;
        // 1. Hapus jika key array cocok dengan salah satu target
        foreach ($targets as $tg) {
            if (isset($existing[$tg])) {
                unset($existing[$tg]);
                $deleted = true;
            }
        }

        // 2. Scan SEMUA item di $existing untuk mencocokkan key, registrationNumber, atau email
        foreach ($existing as $k => $item) {
            $shouldDelete = false;
            $kStr = (string)$k;
            if (in_array($kStr, $targets, true) || in_array(strtoupper($kStr), $targets, true) || in_array(strtolower($kStr), $targets, true)) {
                $shouldDelete = true;
            }
            if (is_array($item)) {
                $rn = strtoupper(trim($item['registrationNumber'] ?? ''));
                $em = strtolower(trim($item['email'] ?? ''));
                foreach ($targets as $tg) {
                    $tgUpper = strtoupper($tg);
                    $tgLower = strtolower($tg);
                    if (($rn !== '' && $rn === $tgUpper) || ($em !== '' && $em === $tgLower)) {
                        $shouldDelete = true;
                        break;
                    }
                }
            }
            if ($shouldDelete) {
                unset($existing[$k]);
                $deleted = true;
            }
        }

        if ($deleted) {
            file_put_contents($storageFile, json_encode($existing, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        }
        echo json_encode(["status" => "ok", "message" => "Item berhasil dihapus dari $entity", "deleted" => $deleted]);
        exit;
    }

    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Format JSON tidak valid"]);
        exit;
    }

    $existing = [];
    if (file_exists($storageFile)) {
        $rawExisting = file_get_contents($storageFile);
        $existing = json_decode($rawExisting, true) ?? [];
    }

    // Deep merge for program states, pekan unlock, attendance, and attendance unlock to prevent overwriting keys
    if ($entity === 'program_states' || $entity === 'programs' || $entity === 'pekan_unlock' || $entity === 'unlock' || $entity === 'attendance' || $entity === 'absensi' || $entity === 'attendance_unlock' || $entity === 'attendance_sessions' || $entity === 'absen_unlock') {
        foreach ($data as $key => $values) {
            if (is_array($values) && isset($existing[$key]) && is_array($existing[$key])) {
                $existing[$key] = array_merge($existing[$key], $values);
            } else {
                $existing[$key] = $values;
            }
        }
        $merged = $existing;
    } elseif ($entity === 'quiz_scores' || $entity === 'quiz') {
        // Enforce strict immutable single-attempt rule for quizzes!
        // Once a student submits a pekan exam, it CANNOT be overwritten by a second attempt.
        $hasAlreadySubmitted = false;
        $rejectedKeys = [];

        foreach ($data as $key => $sub) {
            $user = strtolower(trim($sub['user'] ?? ''));
            $pekan = trim($sub['pekanKey'] ?? '');

            // Check if existing submissions already contain this student for this pekan
            $alreadyExists = false;
            foreach ($existing as $exKey => $exVal) {
                $exUser = strtolower(trim($exVal['user'] ?? ''));
                $exPekan = trim($exVal['pekanKey'] ?? '');
                if ($exPekan === $pekan && $exUser === $user && !empty($user) && !empty($pekan)) {
                    $alreadyExists = true;
                    break;
                }
                if ($exKey === $key) {
                    $alreadyExists = true;
                    break;
                }
            }

            if ($alreadyExists) {
                $hasAlreadySubmitted = true;
                $rejectedKeys[] = $key;
                // DO NOT overwrite $existing entry! Keep existing untouched!
            } else {
                $existing[$key] = $sub;
            }
        }

        $merged = $existing;

        if ($hasAlreadySubmitted && count($rejectedKeys) === count($data)) {
            // All submitted items were already taken!
            echo json_encode([
                "status" => "locked",
                "message" => "Latihan pekan ini sudah pernah dikerjakan sebelumnya dan telah dikunci permanen. Pengerjaan ulang ditolak oleh server.",
                "count" => count($merged)
            ]);
            exit;
        }
    } elseif ($entity === 'registrations' || $entity === 'pendaftar') {
        if (isset($data['registrationNumber'])) {
            $existing[$data['registrationNumber']] = $data;
        } else {
            foreach ($data as $k => $item) {
                if (is_array($item) && isset($item['registrationNumber'])) {
                    $existing[$item['registrationNumber']] = $item;
                } else {
                    $existing[$k] = $item;
                }
            }
        }
        $merged = $existing;
    } elseif ($entity === 'student_accounts' || $entity === 'accounts' || $entity === 'users') {
        if (isset($data['registrationNumber'])) {
            $existing[strtoupper(trim($data['registrationNumber']))] = $data;
        } elseif (isset($data['email'])) {
            $existing[strtolower(trim($data['email']))] = $data;
        } else {
            foreach ($data as $k => $item) {
                if (is_array($item) && isset($item['registrationNumber'])) {
                    $existing[strtoupper(trim($item['registrationNumber']))] = $item;
                } elseif (is_array($item) && isset($item['email'])) {
                    $existing[strtolower(trim($item['email']))] = $item;
                } else {
                    $existing[$k] = $item;
                }
            }
        }
        $merged = $existing;
    } else {
        $merged = array_merge($existing, $data);
    }

    $saved = file_put_contents($storageFile, json_encode($merged, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);

    if ($saved !== false) {
        echo json_encode([
            "status" => "ok",
            "message" => "Data $entity berhasil disimpan di cPanel",
            "count" => count($merged)
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "message" => "Gagal menulis file $storageFile di server"
        ]);
    }
    exit;
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
