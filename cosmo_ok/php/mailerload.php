<?php
	namespace PHPMailer\PHPMailer;

	include_once("functions.php");
	include_once('php/src/PHPMailer.php');
	include_once('php/src/SMTP.php');
	include_once('php/src/Exception.php');

	function oMailerSend ($to = array(), $subject = "", $body = "") {
		$oMailer = new PHPMailer;
		$oMailer->isSMTP();
		$oMailer->Host = $GLOBALS['smtphost'];
		$oMailer->SMTPAuth = true;
		$oMailer->Username = $GLOBALS['smtpuser'];
		$oMailer->Password = $GLOBALS['smtppass'];
		$oMailer->SMTPSecure = 'tls';
		$oMailer->Port = 587;
		$oMailer->From = 'service@scads.de';
		$oMailer->FromName = 'ScaDS';
		$oMailer->isHTML(true);

		if(is_array($to)) {
			$oMailer->Subject = $subject;
			$oMailer->Body = $body;
			$oMailer->AltBody = strip_tags( $oMailer->Body );
			foreach ($to as $email) {
				$oMailer->addAddress($email[0], $email[1]);
			}
		} else {
			if(is_string($to)) {
				$oMailer->addAddress($to, '');
			}
		}

		// $oMailer->sign(
		// 	$GLOBALS['certificate_file'],
		// 	$GLOBALS['private_key_file'],
		// 	$GLOBALS['key_password']
		// );

		if (!$oMailer->send()) {
			return 0;
		} else {
			return 1;
		}
	}
?>
