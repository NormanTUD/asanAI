<div id="register_dialog" class="popup" style="display: none">
	<div class="popup_body less_transparent_glass_box">
		<div id="register_content"> 
			<h1><span class="TRANSLATEME_register"></span></h1>

			<form id="register_form">
				<table>
					<tr>
						<td><span class="TRANSLATEME_email"></span></td>
						<td><input type="email" id="register_email" required></td>
					</tr>

					<tr>
						<td><span class="TRANSLATEME_username"></span></td>
						<td><input id="register_username" minlength="2" required></td>
					</tr>

					<tr>
						<td><span class="TRANSLATEME_password"></span></td>
						<td><input type="password" id="register_password" minlength="8" required></td>
					</tr>

					<tr>
						<td colspan=2>Do you agree with our terms of <a target="_blank" href="user_agreement.php">license</a>? <input id="license" type="checkbox" onclick="show_register_button(this)"></td>
					</tr>

					<tr>
						<td><button id="register_button" onclick="register()" style="display: none"><span class="TRANSLATEME_register"></span></button></td>
						<td></td>
					</tr>

					<tr>
						<td><span style="display: none" id="register_error_msg"></span></td>
						<td></td>
					</tr>
				</table>
			</form>

			<h1><span class="TRANSLATEME_login"></span></h1>

			<table>
				<tr>
					<td><span class="TRANSLATEME_username"></span></td>
					<td><input id="login_username"></td>
				</tr>
				<tr>
					<td><span class="TRANSLATEME_password"></span></td>
					<td><input type="password" id="login_password"></td>
				</tr>
				<tr>
					<td><button class="save_button" onclick="login()"><span class="TRANSLATEME_login"></span></button></td>
					<td></td>
				</tr>
				<tr>
					<td><span style="display: none; background-color: green" id="login_error_msg"></span></td>
					<td></td>
				</tr>
			</table>
		</div>
		<br>
		<button class="close_button" onclick="close_popup('register_dialog')"><span class="TRANSLATEME_close"></span></button>
	</div>
</div>
