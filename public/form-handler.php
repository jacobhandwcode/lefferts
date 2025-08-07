<?php
// Enhanced error logging and debugging
ini_set('log_errors', 1);
ini_set('error_log', '../logs/form_errors.log'); // Move logs outside web root
error_reporting(E_ALL);

// Include PHPMailer - Downloaded manually
require_once 'PHPMailer/src/Exception.php';
require_once 'PHPMailer/src/PHPMailer.php';
require_once 'PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Load configuration securely
function load_config()
{
    return [
        'contact_email' => 'info@lefferts.com',
        'from_email' => 'site-info@lefferts.com',
        'smtp_password' => 'S&8JcPUCy8rOihsP',
        'turnstile_secret' => '0x4AAAAAABnGYtiTkDJKVBmOOTO3fKRvsDM',
        'data_dir' => '../data/',
        'max_requests_per_hour' => 10,
        'max_message_length' => 5000,
        'max_name_length' => 50
    ];
}

$config = load_config();

error_log("=== NEW REQUEST ===");
error_log("Method: " . $_SERVER['REQUEST_METHOD']);
error_log("IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
error_log("User Agent: " . ($_SERVER['HTTP_USER_AGENT'] ?? 'unknown'));

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_log("Invalid method: " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

function check_rate_limit($ip, $config)
{
    $rate_file = $config['data_dir'] . 'rate_limits.json';
    $max_requests = $config['max_requests_per_hour'];
    $time_window = 3600;

    if (!file_exists($config['data_dir'])) {
        if (!mkdir($config['data_dir'], 0755, true)) {
            error_log("Failed to create data directory");
            return false;
        }
    }

    $rates = [];
    if (file_exists($rate_file)) {
        $content = file_get_contents($rate_file);
        if ($content !== false) {
            $rates = json_decode($content, true) ?: [];
        }
    }

    $now = time();
    $user_requests = $rates[$ip] ?? [];

    // Clean old requests
    $user_requests = array_filter($user_requests, function ($time) use ($now, $time_window) {
        return ($now - $time) < $time_window;
    });

    if (count($user_requests) >= $max_requests) {
        error_log("Rate limit exceeded for IP: $ip");
        return false;
    }

    // Add current request
    $user_requests[] = $now;
    $rates[$ip] = array_values($user_requests); // Re-index array

    // Clean up old IPs to prevent file bloat
    foreach ($rates as $stored_ip => $requests) {
        $rates[$stored_ip] = array_filter($requests, function ($time) use ($now, $time_window) {
            return ($now - $time) < $time_window;
        });

        if (empty($rates[$stored_ip])) {
            unset($rates[$stored_ip]);
        }
    }

    file_put_contents($rate_file, json_encode($rates));
    return true;
}

// Verify Turnstile CAPTCHA
function verify_turnstile($token, $secret)
{
    if (empty($token) || empty($secret)) {
        error_log("Turnstile: Missing token or secret");
        return false;
    }

    $url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    $data = [
        'secret' => $secret,
        'response' => $token,
        'remoteip' => $_SERVER['REMOTE_ADDR'] ?? ''
    ];

    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/x-www-form-urlencoded',
            'content' => http_build_query($data),
            'timeout' => 10
        ]
    ]);

    $result = file_get_contents($url, false, $context);
    if ($result === false) {
        error_log("Turnstile: Failed to connect to verification server");
        return false;
    }

    $response = json_decode($result, true);
    $success = $response['success'] ?? false;

    if (!$success) {
        error_log("Turnstile verification failed: " . json_encode($response));
    } else {
        error_log("Turnstile verification successful");
    }

    return $success;
}

// Enhanced validation functions
function validate_name($name, $max_length = 50)
{
    return !empty($name) &&
        strlen($name) <= $max_length &&
        preg_match('/^[a-zA-Z\s\-\'\.]+$/u', trim($name));
}

function validate_email($email)
{
    $email = trim($email);
    return filter_var($email, FILTER_VALIDATE_EMAIL) &&
        strlen($email) <= 254 &&
        !preg_match('/[<>\r\n]/', $email) && // Prevent injection
        !empty($email);
}

function validate_message($message, $max_length = 5000)
{
    return strlen($message) <= $max_length;
}

function sanitize_input($input)
{
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

// Create styled HTML email
function create_styled_email($firstName, $lastName, $email, $user_message, $user_ip)
{
    date_default_timezone_set('America/New_York');
    $formatted_date = date('F j, Y \a\t g:i A');

    $subject = 'Contact: ' . $firstName . ' ' . $lastName;

    $html_message = '
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contact Form</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 20px; 
            background-color: #f5f5f5;
        }
        .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff;
            border: 2px solid #000000;
            border-radius: 0;
        }
        .header { 
            background-color: #ffffff;
            padding: 30px 40px 20px 40px;
            text-align: center;
            border-bottom: 2px solid #000000;
        }
        .logo {
            margin-bottom: 20px;
        }
        .logo img {
            max-height: 60px;
            width: auto;
        }
        .title {
            font-size: 28px;
            font-weight: 600;
            color: #000000;
            margin: 0;
            letter-spacing: -0.5px;
        }
        .subtitle {
            font-size: 16px;
            color: #666666;
            margin: 10px 0 0 0;
            font-weight: 400;
        }
        .content {
            padding: 40px;
        }
        .field-group {
            display: table;
            width: 100%;
            margin-bottom: 20px;
            border-collapse: collapse;
        }
        .field-label {
            display: table-cell;
            width: 140px;
            font-weight: 600;
            color: #000000;
            font-size: 16px;
            vertical-align: top;
            padding-right: 20px;
        }
        .field-value {
            display: table-cell;
            font-size: 16px;
            color: #333333;
            vertical-align: top;
            word-break: break-word;
        }
        .message-field {
            margin-top: 30px;
        }
        .message-label {
            font-weight: 600;
            color: #000000;
            font-size: 16px;
            margin-bottom: 15px;
            display: block;
        }
        .message-content {
            background-color: #ffffff;
            padding: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            font-size: 16px;
            line-height: 1.6;
            color: #333333;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .reply-section {
            text-align: center;
            padding: 30px 40px;
            border-top: 1px solid #e0e0e0;
            background-color: #f9f9f9;
        }
        .reply-button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #ffffff;
            color: #0066cc;
            text-decoration: none;
            border: 2px solid #0066cc;
            border-radius: 0;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.2s ease;
        }
        .reply-button:hover {
            background-color: #0066cc;
            color: #ffffff;
        }
        .footer {
            padding: 20px 40px;
            font-size: 12px;
            color: #888888;
            text-align: center;
            border-top: 1px solid #e0e0e0;
        }
        
        /* Mobile responsive */
        @media only screen and (max-width: 600px) {
            .email-container {
                margin: 10px;
                border: 1px solid #000000;
            }
            .content, .header, .reply-section {
                padding: 20px;
            }
            .field-group {
                display: block;
            }
            .field-label {
                display: block;
                width: auto;
                margin-bottom: 5px;
                padding-right: 0;
            }
            .field-value {
                display: block;
                margin-bottom: 20px;
            }
            .title {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">
                <img src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' id=\'Layer_1\' data-name=\'Layer 1\' version=\'1.1\' viewBox=\'0 0 1072.6 227.4\'%3E%3Cdefs%3E%3Cstyle%3E.cls-1{fill:%23000;stroke-width:0px;}%3C/style%3E%3C/defs%3E%3Cpath class=\'cls-1\' d=\'M70.2,160.3h62.4v11.6H57.7V61h12.5v99.3ZM190.4,121.7h60.5v-11.4h-60.5v-37.9h67.6v-11.4h-80.1v110.9h80.9v-11.4h-68.4v-38.8ZM306.2,171.9h12.5v-48.3h60v-11.4h-60v-39.6h67.2v-11.6h-79.7v110.9ZM432.3,171.9h12.5v-48.3h60v-11.4h-60v-39.6h67.2v-11.6h-79.7v110.9ZM570.9,121.7h60.5v-11.4h-60.5v-37.9h67.6v-11.4h-80.1v110.9h80.9v-11.4h-68.4v-38.8ZM744.2,126.6l34.1,45.3h-15.4l-32.1-43.1h-31.6v43.1h-12.5V61s47.6,0,47.6,0c6.2-.1,12.4.9,18.3,2.9,4.9,1.7,9.5,4.5,13.2,8.2,2.7,2.8,4.9,6,6.3,9.7,1.5,3.9,2.3,8,2.2,12.2v.3c0,4.2-.7,8.5-2.2,12.4-1.4,3.6-3.5,6.8-6.2,9.5-2.8,2.8-6,5-9.6,6.7-3.8,1.8-7.9,3-12,3.7ZM733.2,117.6c3.9,0,7.7-.5,11.4-1.6,3.3-.9,6.3-2.5,9-4.5,5.2-3.9,8.2-10.2,8.1-16.7v-.3c.3-6.3-2.5-12.2-7.4-16.1-6.1-4.2-13.5-6.2-20.9-5.8h-34.2v45h34ZM814.3,72.6h37.2v99.3h12.5v-99.3h37.2v-11.6h-87v11.6ZM1011.6,121.8c-8.1-5.8-17.4-9.7-27.3-11.4-5.1-1-10.1-2.3-15-4-3.3-1.1-6.4-2.7-9.2-4.7-2-1.5-3.6-3.4-4.6-5.7-.9-2.2-1.3-4.6-1.3-7v-.3c0-5,2.3-9.7,6.3-12.8,5-3.7,11.1-5.5,17.3-5.1,5.6,0,11.1.9,16.4,2.9,5.7,2.2,11,5.3,15.6,9.2l7.3-9.7c-5.3-4.3-11.3-7.8-17.7-10.2-6.8-2.4-14.1-3.5-21.3-3.4-5,0-9.9.7-14.6,2.3-4.2,1.4-8.1,3.5-11.6,6.3-3.2,2.6-5.8,5.9-7.6,9.6-1.8,3.8-2.7,7.9-2.7,12v.3c0,4.1.7,8.1,2.2,11.9,1.5,3.5,3.9,6.5,6.8,8.9,3.5,2.8,7.4,5,11.6,6.5,5.4,2,10.9,3.6,16.6,4.7,4.9,1,9.6,2.3,14.3,4,3.2,1.1,6.1,2.6,8.8,4.6,1.9,1.5,3.5,3.4,4.4,5.6.9,2.2,1.3,4.5,1.3,6.9v.3c0,5.3-2.4,10.4-6.7,13.5-5.2,3.8-11.6,5.6-18,5.3-7,.1-14-1.2-20.4-3.9-6.5-3-12.4-6.9-17.6-11.8l-7.8,9.2c6.1,5.7,13.2,10.2,21,13.4,7.8,3,16,4.5,24.3,4.4h0c5.2,0,10.3-.7,15.2-2.2,4.3-1.3,8.4-3.5,11.9-6.3,3.3-2.7,5.9-6.1,7.8-9.9,1.9-4,2.9-8.4,2.8-12.9v-.3c.3-7.7-2.9-15-8.8-20Z\'%3E%3C/path%3E%3C/svg%3E" alt="Lefferts Logo" />
            </div>
            
            <h1 class="title">New Contact Form Submission</h1>
            <p class="subtitle">A new inquiry has been submitted through lefferts.com.</p>
        </div>
        
        <div class="content">
            <div class="field-group">
                <div class="field-label">First Name:</div>
                <div class="field-value">' . htmlspecialchars($firstName) . '</div>
            </div>
            
            <div class="field-group">
                <div class="field-label">Last Name:</div>
                <div class="field-value">' . htmlspecialchars($lastName) . '</div>
            </div>
            
            <div class="field-group">
                <div class="field-label">Email:</div>
                <div class="field-value"><a href="mailto:' . htmlspecialchars($email) . '" style="color: #0066cc; text-decoration: none;">' . htmlspecialchars($email) . '</a></div>
            </div>
            
            <div class="message-field">
                <div class="message-label">Message:</div>
                <div class="message-content">' . 
                    (!empty($user_message) ? htmlspecialchars($user_message) : 'No message provided') . 
                '</div>
            </div>
        </div>
        
        <div class="reply-section">
            <a href="mailto:' . htmlspecialchars($email) . '?subject=Re: Your inquiry to Lefferts" class="reply-button">Reply</a>
        </div>
        
        <div class="footer">
            <p>Submitted on ' . $formatted_date . ' from IP: ' . htmlspecialchars($user_ip) . '<br>
            Via lefferts.com contact form</p>
        </div>
    </div>
</body>
</html>';

    return [$subject, $html_message];
}

// Enhanced email function using PHPMailer with SMTP
function send_email_with_smtp($to, $subject, $html_message, $text_message, $customer_email, $config)
{
    error_log("Attempting to send email via SMTP:");
    error_log("To: " . $to);
    error_log("Subject: " . $subject);

    $mail = new PHPMailer(true);

    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host = 'smtp.dreamhost.com';
        $mail->SMTPAuth = true;
        $mail->Username = $config['from_email'];
        $mail->Password = $config['smtp_password'];
        $mail->SMTPSecure = 'tls';
        $mail->Port = 587;

        // Enable verbose debug output if needed (comment out for production)
        // $mail->SMTPDebug = SMTP::DEBUG_SERVER;

        // Recipients
        $mail->setFrom($config['from_email'], 'Lefferts Contact Form');
        $mail->addAddress($to);
        $mail->addReplyTo($config['from_email'], 'Lefferts');

        // Content
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $html_message;
        $mail->AltBody = $text_message;

        // Additional headers to avoid spam detection
        $mail->addCustomHeader('X-Auto-Response-Suppress', 'All');
        $mail->addCustomHeader('X-ContactForm', 'lefferts.com');

        $result = $mail->send();

        if ($result) {
            error_log("SMTP email sent successfully");
        }

        return $result;
    } catch (Exception $e) {
        error_log("SMTP email failed: " . $mail->ErrorInfo);
        error_log("Exception: " . $e->getMessage());
        return false;
    }
}

// Check rate limit first
$user_ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
if (!check_rate_limit($user_ip, $config)) {
    http_response_code(429);
    echo json_encode(['error' => 'Too many requests. Please try again in an hour.']);
    exit;
}

// Get and validate input
$raw_input = file_get_contents('php://input');
if (empty($raw_input)) {
    error_log("Empty input received");
    http_response_code(400);
    echo json_encode(['error' => 'No data received']);
    exit;
}

$input = json_decode($raw_input, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    error_log("JSON decode error: " . json_last_error_msg());
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON data']);
    exit;
}

$form_type = $input['form_type'] ?? '';
error_log("Form type: " . $form_type);

// Verify Turnstile for contact forms
if ($form_type === 'contact') {
    $turnstile_token = $input['cf-turnstile-response'] ?? '';
    if (!verify_turnstile($turnstile_token, $config['turnstile_secret'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Security verification failed. Please try again.']);
        exit;
    }
}

if ($form_type === 'newsletter') {
    error_log("Processing newsletter form");

    $name = $input['name'] ?? '';
    $email = $input['email'] ?? '';

    // Validate inputs
    if (!validate_name($name, $config['max_name_length'])) {
        error_log("Newsletter: Invalid name: " . $name);
        http_response_code(400);
        echo json_encode(['error' => 'Please enter a valid name (letters, spaces, hyphens, apostrophes only)']);
        exit;
    }

    if (!validate_email($email)) {
        error_log("Newsletter: Invalid email: " . $email);
        http_response_code(400);
        echo json_encode(['error' => 'Please enter a valid email address']);
        exit;
    }

    // Sanitize after validation
    $name = sanitize_input($name);
    $email = filter_var(trim($email), FILTER_SANITIZE_EMAIL);

    error_log("Newsletter validated data - Name: $name, Email: $email");

    // Save to JSON file
    $newsletter_file = $config['data_dir'] . 'newsletter-subscriptions.json';

    try {
        // Create data directory if it doesn't exist
        if (!file_exists($config['data_dir'])) {
            if (!mkdir($config['data_dir'], 0755, true)) {
                error_log("Failed to create data directory");
                throw new Exception("Could not create data directory");
            }
            error_log("Created data directory");
        }

        // Read existing subscriptions
        $subscriptions = [];
        if (file_exists($newsletter_file)) {
            $content = file_get_contents($newsletter_file);
            if ($content !== false) {
                $subscriptions = json_decode($content, true) ?: [];
            }
        }

        // Check for duplicate email
        foreach ($subscriptions as $sub) {
            if (strtolower($sub['email']) === strtolower($email)) {
                error_log("Newsletter: Duplicate email attempt: " . $email);
                http_response_code(400);
                echo json_encode(['error' => 'This email is already subscribed.']);
                exit;
            }
        }

        // Add new subscription with timestamp
        $subscription = [
            'name' => $name,
            'email' => $email,
            'subscribed_at' => date('Y-m-d H:i:s')
        ];

        $subscriptions[] = $subscription;

        // Save to file with proper permissions
        if (file_put_contents($newsletter_file, json_encode($subscriptions, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) === false) {
            error_log("Failed to save newsletter subscription to file");
            throw new Exception("Could not save subscription");
        }

        // Set restrictive permissions
        chmod($newsletter_file, 0644);

        error_log("Newsletter subscription saved successfully - Name: $name, Email: $email");

        echo json_encode(['success' => true, 'message' => 'Thank you for subscribing!']);
    } catch (Exception $e) {
        error_log("Newsletter file error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save subscription. Please try again.']);
    }
} elseif ($form_type === 'contact') {
    error_log("Processing contact form");

    $firstName = $input['firstName'] ?? '';
    $lastName = $input['lastName'] ?? '';
    $email = $input['email'] ?? '';
    $user_message = $input['message'] ?? '';

    error_log("Contact raw data - First: '$firstName', Last: '$lastName', Email: '$email', Message length: " . strlen($user_message));

    // Validate all inputs
    if (!validate_name($firstName, $config['max_name_length'])) {
        error_log("Contact: Invalid first name: " . $firstName);
        http_response_code(400);
        echo json_encode(['error' => 'Please enter a valid first name (letters, spaces, hyphens, apostrophes only)']);
        exit;
    }

    if (!validate_name($lastName, $config['max_name_length'])) {
        error_log("Contact: Invalid last name: " . $lastName);
        http_response_code(400);
        echo json_encode(['error' => 'Please enter a valid last name (letters, spaces, hyphens, apostrophes only)']);
        exit;
    }

    if (!validate_email($email)) {
        error_log("Contact: Invalid email: " . $email);
        http_response_code(400);
        echo json_encode(['error' => 'Please enter a valid email address']);
        exit;
    }

    if (!validate_message($user_message, $config['max_message_length'])) {
        error_log("Contact: Message too long: " . strlen($user_message) . " characters");
        http_response_code(400);
        echo json_encode(['error' => 'Message is too long. Please limit to ' . $config['max_message_length'] . ' characters.']);
        exit;
    }

    // Sanitize after validation
    $firstName = sanitize_input($firstName);
    $lastName = sanitize_input($lastName);
    $email = filter_var(trim($email), FILTER_SANITIZE_EMAIL);
    $user_message = sanitize_input($user_message);

    error_log("Contact validated data - Name: '$firstName $lastName', Email: '$email'");

    // Save contact submission for record keeping
    $contact_file = $config['data_dir'] . 'contact-submissions.json';
    $contact_record = [
        'timestamp' => date('Y-m-d H:i:s'),
        'name' => $firstName . ' ' . $lastName,
        'email' => $email,
        'message' => $user_message,
        'ip' => $user_ip,
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
    ];

    try {
        // Read existing contacts
        $contacts = [];
        if (file_exists($contact_file)) {
            $content = file_get_contents($contact_file);
            if ($content !== false) {
                $contacts = json_decode($content, true) ?: [];
            }
        }

        $contacts[] = $contact_record;

        // Keep only last 1000 submissions to prevent file bloat
        if (count($contacts) > 1000) {
            $contacts = array_slice($contacts, -1000);
        }

        file_put_contents($contact_file, json_encode($contacts, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        chmod($contact_file, 0644);
    } catch (Exception $e) {
        error_log("Failed to save contact record: " . $e->getMessage());
        // Don't fail the form submission if record keeping fails
    }

    // Create styled HTML email
    list($subject, $html_message) = create_styled_email($firstName, $lastName, $email, $user_message, $user_ip);

    // Create plain text version
    $text_message = "REPLY TO CUSTOMER: " . $email . "\n";
    $text_message .= "Customer Name: " . $firstName . " " . $lastName . "\n";
    $text_message .= "Customer Email: " . $email . "\n";
    $text_message .= "Date: " . date('F j, Y \a\t g:i A') . "\n\n";
    $text_message .= "Message:\n" . $user_message . "\n\n";
    $text_message .= "Submitted from IP: " . $user_ip . "\n";
    $text_message .= "Via: lefferts.com contact form";

    error_log("CONTACT FORM: About to send SMTP email to " . $config['contact_email']);

    if (send_email_with_smtp($config['contact_email'], $subject, $html_message, $text_message, $email, $config)) {
        error_log("CONTACT FORM: SMTP email sent successfully");
        echo json_encode(['success' => true, 'message' => 'Thank you for your message! We will get back to you soon.']);
    } else {
        error_log("CONTACT FORM: SMTP email failed to send");
        http_response_code(500);
        echo json_encode(['error' => 'Failed to send your message. Please try again or contact us directly.']);
    }
} else {
    error_log("Invalid form type received: '$form_type'");
    http_response_code(400);
    echo json_encode(['error' => 'Invalid form type']);
}

error_log("=== REQUEST COMPLETED ===\n");
