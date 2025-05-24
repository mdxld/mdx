import { IconType } from 'react-icons';

/**
 * Icon library mappings
 */
export const ICON_LIBRARIES = {
  Io: 'react-icons/io5',
  Fa: 'react-icons/fa',
  Md: 'react-icons/md',
  Bs: 'react-icons/bs',
  Hi: 'react-icons/hi',
  Fi: 'react-icons/fi',
} as const;

/**
 * Common icon names for each library (subset for initial implementation)
 */
export type IoniconsNames = 
  | 'IoRocketSharp'
  | 'IoHomeSharp'
  | 'IoPersonSharp'
  | 'IoSettingsSharp'
  | 'IoAlertSharp'
  | 'IoAppsSharp'
  | 'IoArrowBackSharp'
  | 'IoArrowForwardSharp'
  | 'IoBookmarkSharp'
  | 'IoCalendarSharp'
  | 'IoCloudSharp'
  | 'IoDocumentSharp'
  | 'IoDownloadSharp'
  | 'IoFolderSharp'
  | 'IoHeartSharp'
  | 'IoMailSharp'
  | 'IoSearchSharp'
  | 'IoStarSharp';

export type FontAwesomeNames =
  | 'FaHeart'
  | 'FaStar'
  | 'FaGithub'
  | 'FaUser'
  | 'FaHome'
  | 'FaBook'
  | 'FaCalendar'
  | 'FaCheck'
  | 'FaClock'
  | 'FaCog'
  | 'FaDownload'
  | 'FaEnvelope'
  | 'FaFile'
  | 'FaFolder'
  | 'FaLink'
  | 'FaSearch'
  | 'FaTimes'
  | 'FaTrash';

export type MaterialDesignNames =
  | 'MdHome'
  | 'MdPerson'
  | 'MdSettings'
  | 'MdAdd'
  | 'MdArrowBack'
  | 'MdArrowForward'
  | 'MdBookmark'
  | 'MdCheck'
  | 'MdClose'
  | 'MdDelete'
  | 'MdDownload'
  | 'MdEdit'
  | 'MdEmail'
  | 'MdFavorite'
  | 'MdInfo'
  | 'MdMenu'
  | 'MdNotifications'
  | 'MdSearch';

/**
 * Union type of all supported icon names
 */
export type IconName = IoniconsNames | FontAwesomeNames | MaterialDesignNames;

/**
 * Helper function to determine which library an icon belongs to
 */
export function getIconLibrary(iconName: string): keyof typeof ICON_LIBRARIES | null {
  for (const [prefix, _] of Object.entries(ICON_LIBRARIES)) {
    if (iconName.startsWith(prefix)) {
      return prefix as keyof typeof ICON_LIBRARIES;
    }
  }
  return null;
}
