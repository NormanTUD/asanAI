<?php
    //anmelden, registrieren
    include('functions.php');
    
    $status_code = 200;
    
    try{
        if(array_key_exists("username", $_GET) && array_key_exists("email", $_GET) && array_key_exists("pw", $_GET)) {
            if($_GET["username"] != "") {
                if($_GET["pw"] != "" && (strlen($_GET["pw"]) > 7)) {
                    if(!get_single_value_from_query('select username from tfd_db.login where username = '.esc($_GET["username"]))) {
                        if(!get_single_value_from_query('select email from tfd_db.login where email = '.esc($_GET["email"]))) {
                            $salt = generateRandomString();
                            $query = 'insert into tfd_db.login (username, email, pw, salt) values ('.esc($_GET["username"]).', '.esc($_GET["email"]).', '.esc(hash("sha256", $_GET["pw"].$salt)).', '.esc($salt).')';
                            run_query ($query);
                
                            insert_session_id(esc($_GET["username"]), $_GET["days"]);
                            
                            $session_id = get_session_id(esc($_GET["username"]));
                            $status = ["status" => "ok", "msg" => "Account created", "session_id" => $session_id, "time" => get_expiry_date($session_id)];
                        } else {
                            $status = ["status" => "error", "msg" => "Did you forget your password? Link: get_new_password.php"];
                        }
                    } else {
                        $status = ["status" => "error", "msg" => "Username already exists choose another one."];
                    }
                } else {
                    $status = ["status" => "error", "msg" => "Password is empty. Please choose a password. Password is too short: ".strlen($_GET["pw"])];
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