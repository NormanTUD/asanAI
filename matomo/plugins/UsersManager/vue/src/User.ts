/*!
 * Matomo - free/libre analytics platform
 *
 * @link    https://matomo.org
 * @license https://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */

interface User {
  login: string;
  superuser_access: boolean;
  uses_2fa: boolean;
  password?: string;
  email: string;
  role?: string;
  invite_status?: string;
}

export default User;
