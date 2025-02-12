<?php
    //anmelden, registrieren
    include('../functions.php');
    
    $status_code = 200;
    
    try{
        $days = 7;
        if(array_key_exists("days", $_GET) && is_numeric($_GET["days"])) {
            $days = $_GET["days"];
        }
        if(array_key_exists("username", $_GET) && array_key_exists("email", $_GET) && array_key_exists("pw", $_GET)) {
            $username = $_GET["username"];
            $email = $_GET["email"];
            $password = $_GET["pw"];
            if($username != "") {
                if($password != "" && (strlen($password) > 7)) {
                    if(!get_single_value_from_query('select username from tfd_db.login where username = '.esc($username))) {
                        if(!get_single_value_from_query('select email from tfd_db.login where email = '.esc($email))) {
                            $salt = generateRandomString();
                            $query = 'insert into tfd_db.login (username, email, pw, salt, role_id) values ('.esc($username).', '.esc($email).', '.esc(hash("sha256", $password.$salt)).', '.esc($salt).', 2)';
                            run_query ($query);
                
                            insert_session_id($username, $days);
                            
                            $session_id = get_session_id($username);
                            $status = ["status" => "ok", "msg" => "Account created", "session_id" => $session_id, "time" => get_expiry_date($session_id)];
                        } else {
                            $status = [
                                "status" => "error", 
                                "msg" => "Did you forget your password? Link: <a href='php_files/user_changes_password.php'>Change password</a>"
                            ];
                        }
                    } else {
                        $status = ["status" => "error", "msg" => "Username already exists choose another one."];
                    }
                } else {
                    $status = ["status" => "error", "msg" => "Password is too short it needs at least 8 characters."];
                }
            } else {
                $status = ["status" => "error", "msg" => "Username is empty. Please choose a username."];
            }
        } else {
            $status = ["status" => "error", "msg" => "Please fill in all fields: user, email and password."];
        }
        
    } catch(throwable $e){
        $status = ["status" => "error", "msg" => "Something wrong with the input."];
    }

    http_response_code($status_code);
    header('Content-Type: application/json');
    print json_encode($status);
    
?>
