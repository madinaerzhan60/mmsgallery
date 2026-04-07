/* ══════════════════════════════════════════════════════════
   MMS GALLERY - Main Application JavaScript
   ══════════════════════════════════════════════════════════ */

/* ── Theme Toggle ── */
const I18N_KEY = 'mms_lang';
const SUPPORTED_LANGS = ['en', 'ru', 'kk'];
const I18N_ASSET_PATHS = {
  en: '/i18n/en.json',
  ru: '/i18n/ru.json',
  kk: '/i18n/kk.json'
};
let I18N_FILES = {};
const I18N = {
  en: {
    all: 'All',
    home: 'Home',
    gallery: 'Gallery',
    artists: 'Artists',
    hire: 'Hire',
    contact: 'Contact',
    login: 'Login',
    signup: 'Sign Up',
    logout: 'Logout',
    myAccount: 'My Account',
    settings: 'Settings',
    publicProfile: 'Public Profile',
    openPublicProfile: 'Open Public Profile',
    admin: 'Admin',
    toggleTheme: 'Toggle theme',
    notifications: 'Notifications',
    noNotifications: 'No notifications yet',
    aboutMms: 'About MMS Gallery',
    aboutText: 'MMS Gallery is the official student multimedia exhibition platform of SDU University - a space where creativity meets technology.',
    quickLinks: 'Quick Links',
    submitWork: 'Submit Work',
    contactUs: 'Contact Us',
    followUs: 'Follow Us',
    footerCopy: '© 2025 MMS Gallery - SDU University. All rights reserved.',
    followingFeed: 'Following Feed',
    allWorks: 'All Works',
    loadMore: 'Load More Works',
    noWorksFilter: 'No works found for this filter.',
    follow: 'Follow',
    unfollow: 'Unfollow',
    openToWork: 'Open to Work',
    followers: 'Followers',
    following: 'Following',
    works: 'Works',
    likes: 'Likes',
    comments: 'Comments',
    writeComment: 'Write a comment',
    postComment: 'Post Comment',
    commentPosted: 'Comment posted',
    loginToComment: 'Sign in to write a comment',
    likeThisWork: 'Like this work',
    delete: 'Delete',
    profile: 'Profile',
    account: 'Account',
    appearance: 'Appearance',
    privacy: 'Privacy',
    dashboardIntro: 'Welcome back! Manage your submissions and track your portfolio.',
    uploadNewWork: '+ Upload New Work',
    totalWorks: 'Total Works',
    totalLikes: 'Total Likes',
    approved: 'Approved',
    pending: 'Pending',
    rejected: 'Rejected',
    sending: 'Sending...',
    feedbackSent: 'Feedback sent',
    feedbackThanks: 'Thank you. Your feedback has been sent successfully.',
    deleteAccountHelp: 'Type your email to confirm deletion. This action is permanent and cannot be undone.',
    getInTouch: 'Get In Touch',
    contactPrompt: "Have questions? We'd love to hear from you.",
    contactInfo: 'Contact Info',
    name: 'Name',
    yourName: 'Your Name',
    min6Chars: 'Min. 6 chars',
    repeatPassword: 'Repeat',
    email: 'Email',
    subject: 'Subject',
    message: 'Message',
    send: 'Send',
    generalQuestion: 'General Question',
    bugReport: 'Bug Report',
    collaboration: 'Collaboration',
    other: 'Other',
    exportCsv: 'Export CSV',
    manageStudents: 'Manage Students',
    allRegisteredStudentAccounts: 'All registered student accounts.',
    manageArtworks: 'Manage Artworks',
    reviewApproveRejectSubmissions: 'Review, approve or reject student submissions.',
    feedbackSubmissions: 'Feedback Submissions',
    messagesSentFromContactForm: 'Messages sent from the Contact form.',
    viewMessages: 'View Messages',
    followGraph: 'Follow Graph',
    topStudentsByFollowersAndFollowing: 'Top students by followers and following counts.',
    clearFilters: 'Clear filters',
    students: 'students',
    browseCreators: 'Browse Creators',
    newest: 'Newest',
    mostLiked: 'Most liked',
    mostFollowers: 'Most followers',
    your: 'Your',
    yourDashboard: 'Your Dashboard',
    recentSubmissionsHeader: 'Recent Submissions',
    myWorksHeader: 'My Works',
    uploadYourWorkHeader: 'Upload Your Work',
    myProfileHeader: 'My Profile',
    recentSubmissions: 'Recent Submissions',
    myWorks: 'My Works',
    uploadYourWork: 'Upload Your Work',
    updateYourProfileInformation: 'Update your profile information.',
    shareYourCreativeProjectsWithTheGallery: 'Share your creative projects with the gallery. All submissions are reviewed before publishing.',
    manageYourSubmissionsAndTrackYourPortfolio: 'Welcome back! Manage your submissions and track your portfolio.',
    projectTitleLabel: 'Project Title *',
    giveYourWorkATitle: 'Give your work a title',
    selectCategoryOption: 'Select a category',
    descriptionLabel: 'Description',
    describeYourWorkInspirationAndProcess: 'Describe your work, inspiration, and process...',
    tagsLabel: 'Tags (comma separated)',
    tagsExample: 'e.g. abstract, landscape, digital',
    uploadImageLabel: 'Upload Image *',
    clickToUpload: 'Click to upload',
    orDragAndDrop: 'or drag and drop',
    uploadFileHelp: 'JPG, PNG, GIF, WebP - Max 20MB',
    submitForReview: 'Submit for Review',
    cat_motion_graphics: '3D and Motion Graphics',
    cat_video_film: 'Video and Film',
    cat_interactive_media: 'Interactive Media',
    image: 'Image',
    title: 'Title',
    artist: 'Artist',
    categoryLabel: 'Category',
    statusLabel: 'Status',
    likesLabel: 'Likes',
    dateLabel: 'Date',
    actionsLabel: 'Actions',
    majorLabel: 'Major',
    joinedLabel: 'Joined',
    ratio: 'Ratio',
    overviewOfPlatform: 'Overview of the MMS Gallery platform.'
  },
  ru: {
    all: 'Все',
    home: 'Главная',
    gallery: 'Галерея',
    artists: 'Авторы',
    hire: 'Найти специалиста',
    contact: 'Обратная связь',
    login: 'Войти',
    signup: 'Регистрация',
    logout: 'Выйти',
    myAccount: 'Мой профиль',
    settings: 'Настройки',
    publicProfile: 'Публичный профиль',
    openPublicProfile: 'Открыть публичный профиль',
    admin: 'Админ',
    toggleTheme: 'Сменить тему',
    notifications: 'Уведомления',
    noNotifications: 'Пока нет уведомлений',
    aboutMms: 'О MMS Gallery',
    aboutText: 'MMS Gallery - официальная платформа мультимедийных студенческих работ SDU University, где творчество встречается с технологиями.',
    quickLinks: 'Быстрые ссылки',
    submitWork: 'Добавить работу',
    contactUs: 'Связаться с нами',
    followUs: 'Мы в соцсетях',
    footerCopy: '© 2025 MMS Gallery - SDU University. Все права защищены.',
    followingFeed: 'Лента подписок',
    allWorks: 'Все работы',
    loadMore: 'Показать еще',
    noWorksFilter: 'По этому фильтру работ не найдено.',
    follow: 'Подписаться',
    unfollow: 'Отписаться',
    openToWork: 'Открыт к работе',
    followers: 'Подписчики',
    following: 'Подписки',
    works: 'Работы',
    likes: 'Лайки',
    comments: 'Комментарии',
    writeComment: 'Написать комментарий',
    postComment: 'Опубликовать комментарий',
    commentPosted: 'Комментарий опубликован',
    loginToComment: 'Войдите, чтобы оставить комментарий',
    likeThisWork: 'Поставить лайк работе',
    delete: 'Удалить',
    profile: 'Профиль',
    account: 'Аккаунт',
    appearance: 'Внешний вид',
    privacy: 'Конфиденциальность',
    dashboardIntro: 'С возвращением! Управляйте отправленными работами и отслеживайте портфолио.',
    uploadNewWork: '+ Загрузить работу',
    totalWorks: 'Всего работ',
    totalLikes: 'Всего лайков',
    approved: 'Одобрено',
    pending: 'На модерации',
    rejected: 'Отклонено',
    sending: 'Отправка...',
    feedbackSent: 'Обращение отправлено',
    feedbackThanks: 'Спасибо. Ваше сообщение успешно отправлено.',
    deleteAccountHelp: 'Введите email, чтобы подтвердить удаление. Это действие необратимо.',
    getInTouch: 'Свяжитесь с нами',
    contactPrompt: 'Есть вопросы? Мы будем рады вашему сообщению.',
    contactInfo: 'Контактная информация',
    name: 'Имя',
    yourName: 'Ваше имя',
    min6Chars: 'Минимум 6 символов',
    repeatPassword: 'Повторите',
    email: 'Почта',
    subject: 'Тема',
    message: 'Сообщение',
    send: 'Отправить',
    generalQuestion: 'Общий вопрос',
    bugReport: 'Сообщение об ошибке',
    collaboration: 'Сотрудничество',
    other: 'Другое',
    exportCsv: 'Экспорт CSV',
    manageStudents: 'Управление студентами',
    allRegisteredStudentAccounts: 'Все зарегистрированные студенческие аккаунты.',
    manageArtworks: 'Управление работами',
    reviewApproveRejectSubmissions: 'Проверяйте, одобряйте или отклоняйте студенческие работы.',
    feedbackSubmissions: 'Обращения обратной связи',
    messagesSentFromContactForm: 'Сообщения, отправленные через форму контактов.',
    viewMessages: 'Просмотреть сообщения',
    followGraph: 'Граф подписок',
    topStudentsByFollowersAndFollowing: 'Топ студентов по числу подписчиков и подписок.',
    clearFilters: 'Сбросить фильтры',
    students: 'студентов',
    browseCreators: 'Просмотр авторов',
    newest: 'Сначала новые',
    mostLiked: 'Больше всего лайков',
    mostFollowers: 'Больше всего подписчиков',
    your: 'Ваш',
    yourDashboard: 'Ваша панель',
    recentSubmissionsHeader: 'Недавние отправки',
    myWorksHeader: 'Мои работы',
    uploadYourWorkHeader: 'Загрузить работу',
    myProfileHeader: 'Мой профиль',
    recentSubmissions: 'Недавние отправки',
    myWorks: 'Мои работы',
    uploadYourWork: 'Загрузить работу',
    updateYourProfileInformation: 'Обновите информацию профиля.',
    shareYourCreativeProjectsWithTheGallery: 'Поделитесь своими творческими проектами с галереей. Все работы проходят проверку перед публикацией.',
    manageYourSubmissionsAndTrackYourPortfolio: 'С возвращением! Управляйте отправленными работами и отслеживайте портфолио.',
    projectTitleLabel: 'Название проекта *',
    giveYourWorkATitle: 'Дайте вашей работе название',
    selectCategoryOption: 'Выберите категорию',
    descriptionLabel: 'Описание',
    describeYourWorkInspirationAndProcess: 'Опишите свою работу, вдохновение и процесс...',
    tagsLabel: 'Теги (через запятую)',
    tagsExample: 'например, абстракция, пейзаж, digital',
    uploadImageLabel: 'Загрузить изображение *',
    clickToUpload: 'Нажмите, чтобы загрузить',
    orDragAndDrop: 'или перетащите файл',
    uploadFileHelp: 'JPG, PNG, GIF, WebP - максимум 20 МБ',
    submitForReview: 'Отправить на проверку',
    cat_motion_graphics: '3D и моушн-графика',
    cat_video_film: 'Видео и фильм',
    cat_interactive_media: 'Интерактивные медиа',
    image: 'Изображение',
    title: 'Название',
    artist: 'Автор',
    categoryLabel: 'Категория',
    statusLabel: 'Статус',
    likesLabel: 'Лайки',
    dateLabel: 'Дата',
    actionsLabel: 'Действия',
    majorLabel: 'Направление',
    joinedLabel: 'Дата регистрации',
    ratio: 'Соотношение',
    overviewOfPlatform: 'Обзор платформы MMS Gallery.'
  },
  kk: {
    all: 'Барлығы',
    home: 'Басты бет',
    gallery: 'Галерея',
    artists: 'Авторлар',
    hire: 'Маман іздеу',
    contact: 'Байланыс',
    login: 'Кіру',
    signup: 'Тіркелу',
    logout: 'Шығу',
    myAccount: 'Профиль',
    settings: 'Баптаулар',
    publicProfile: 'Жария профиль',
    openPublicProfile: 'Жария профильді ашу',
    admin: 'Әкімші',
    toggleTheme: 'Тақырыпты ауыстыру',
    notifications: 'Хабарламалар',
    noNotifications: 'Хабарлама әзірге жоқ',
    aboutMms: 'MMS Gallery туралы',
    aboutText: 'MMS Gallery - SDU University студенттерінің ресми мультимедиялық көрме платформасы, мұнда шығармашылық пен технология тоғысады.',
    quickLinks: 'Жылдам сілтемелер',
    submitWork: 'Жұмыс жүктеу',
    contactUs: 'Бізбен байланыс',
    followUs: 'Әлеуметтік желілер',
    footerCopy: '© 2025 MMS Gallery - SDU University. Барлық құқықтар қорғалған.',
    followingFeed: 'Жазылым лентасы',
    allWorks: 'Барлық жұмыстар',
    loadMore: 'Тағы жүктеу',
    noWorksFilter: 'Бұл сүзгі бойынша жұмыс табылмады.',
    follow: 'Жазылу',
    unfollow: 'Жазылымнан шығу',
    openToWork: 'Жұмысқа ашық',
    followers: 'Жазылушылар',
    following: 'Жазылымдар',
    works: 'Жұмыстар',
    likes: 'Ұнатулар',
    comments: 'Пікірлер',
    writeComment: 'Пікір жазу',
    postComment: 'Пікірді жіберу',
    commentPosted: 'Пікір жарияланды',
    loginToComment: 'Пікір жазу үшін кіріңіз',
    likeThisWork: 'Жұмысқа ұнату белгісін қою',
    delete: 'Жою',
    profile: 'Профиль',
    account: 'Аккаунт',
    appearance: 'Көрініс',
    privacy: 'Құпиялылық',
    dashboardIntro: 'Қайта қош келдіңіз! Жүктелген жұмыстарды басқарыңыз және портфолионы қадағалаңыз.',
    uploadNewWork: '+ Жаңа жұмыс жүктеу',
    totalWorks: 'Жалпы жұмыстар',
    totalLikes: 'Жалпы ұнатулар',
    approved: 'Бекітілді',
    pending: 'Күтілуде',
    rejected: 'Қабылданбады',
    sending: 'Жіберілуде...',
    feedbackSent: 'Кері байланыс жіберілді',
    feedbackThanks: 'Рахмет. Сіздің хабарламаңыз сәтті жіберілді.',
    deleteAccountHelp: 'Жоюды растау үшін электрондық поштаңызды енгізіңіз. Бұл әрекет қайтарылмайды.',
    getInTouch: 'Байланысқа шығыңыз',
    contactPrompt: 'Сұрақтарыңыз бар ма? Бізге жазуыңызға қуаныштымыз.',
    contactInfo: 'Байланыс ақпараты',
    name: 'Аты',
    yourName: 'Атыңыз',
    min6Chars: 'Кемінде 6 таңба',
    repeatPassword: 'Қайталаңыз',
    email: 'Пошта',
    subject: 'Тақырып',
    message: 'Хабарлама',
    send: 'Жіберу',
    generalQuestion: 'Жалпы сұрақ',
    bugReport: 'Қате туралы хабарлама',
    collaboration: 'Ынтымақтастық',
    other: 'Басқа',
    exportCsv: 'CSV экспорттау',
    manageStudents: 'Студенттерді басқару',
    allRegisteredStudentAccounts: 'Барлық тіркелген студент аккаунттары.',
    manageArtworks: 'Жұмыстарды басқару',
    reviewApproveRejectSubmissions: 'Студенттердің жұмыстарын қараңыз, мақұлдаңыз немесе кері қайтарыңыз.',
    feedbackSubmissions: 'Кері байланыс өтінімдері',
    messagesSentFromContactForm: 'Байланыс формасынан жіберілген хабарламалар.',
    viewMessages: 'Хабарламаларды көру',
    followGraph: 'Жазылым графы',
    topStudentsByFollowersAndFollowing: 'Жазылушылар мен жазылымдар саны бойынша үздік студенттер.',
    clearFilters: 'Сүзгілерді тазалау',
    students: 'студенттер',
    browseCreators: 'Авторларды шолу',
    newest: 'Ең жаңа',
    mostLiked: 'Ең көп ұнатылған',
    mostFollowers: 'Ең көп жазылушы',
    your: 'Сіздің',
    yourDashboard: 'Сіздің панель',
    recentSubmissionsHeader: 'Соңғы жіберілімдер',
    myWorksHeader: 'Менің жұмыстарым',
    uploadYourWorkHeader: 'Жұмысты жүктеу',
    myProfileHeader: 'Менің профилім',
    recentSubmissions: 'Соңғы жіберілімдер',
    myWorks: 'Менің жұмыстарым',
    uploadYourWork: 'Жұмысты жүктеу',
    updateYourProfileInformation: 'Профиль ақпаратын жаңартыңыз.',
    shareYourCreativeProjectsWithTheGallery: 'Шығармашылық жобаларыңызды галереямен бөлісіңіз. Барлық жұмыстар жарияланар алдында тексеріледі.',
    manageYourSubmissionsAndTrackYourPortfolio: 'Қайта қош келдіңіз! Жүктелген жұмыстарды басқарыңыз және портфолионы қадағалаңыз.',
    projectTitleLabel: 'Жоба атауы *',
    giveYourWorkATitle: 'Жұмысыңызға атау беріңіз',
    selectCategoryOption: 'Санатты таңдаңыз',
    descriptionLabel: 'Сипаттама',
    describeYourWorkInspirationAndProcess: 'Жұмысыңызды, шабытты және жасалу барысын сипаттаңыз...',
    tagsLabel: 'Тегтер (үтірмен бөлінген)',
    tagsExample: 'мысалы, abstract, landscape, digital',
    uploadImageLabel: 'Суретті жүктеу *',
    clickToUpload: 'Жүктеу үшін басыңыз',
    orDragAndDrop: 'немесе сүйреп апарыңыз',
    uploadFileHelp: 'JPG, PNG, GIF, WebP - ең көбі 20 MB',
    submitForReview: 'Тексеруге жіберу',
    cat_motion_graphics: '3D және motion graphics',
    cat_video_film: 'Видео және фильм',
    cat_interactive_media: 'Интерактивті медиа',
    image: 'Сурет',
    title: 'Атауы',
    artist: 'Автор',
    categoryLabel: 'Санат',
    statusLabel: 'Күйі',
    likesLabel: 'Ұнатулар',
    dateLabel: 'Күні',
    actionsLabel: 'Әрекеттер',
    majorLabel: 'Бағыт',
    joinedLabel: 'Тіркелген күні',
    ratio: 'Қатынас',
    overviewOfPlatform: 'MMS Gallery платформасына шолу.'
  }
};

const EXTRA_I18N = {
  en: {
    'Digital Art': 'Digital Art',
    '3D': '3D',
    Animation: 'Animation',
    Photography: 'Photography',
    VFX: 'VFX',
    'UX/UI': 'UX/UI',
    'Game Art': 'Game Art',
    Illustration: 'Illustration',
    Video: 'Video',
    Interactive: 'Interactive',
    'Digital Artist': 'Digital Artist',
    '3D Artist': '3D Artist',
    'Motion Designer': 'Motion Designer',
    Illustrator: 'Illustrator',
    Videographer: 'Videographer',
    '1st Year': '1st Year',
    '2nd Year': '2nd Year',
    '3rd Year': '3rd Year',
    '4th Year': '4th Year',
    Graduate: 'Graduate',
    Master: 'Master',
    '3D Modeler': '3D Modeler',
    '3D/2D Animator': '3D/2D Animator',
    'VFX Artist': 'VFX Artist',
    'Film Editor': 'Film Editor',
    'Graphic Designer': 'Graphic Designer',
    'UX/UI Designer': 'UX/UI Designer',
    'IoT Engineer': 'IoT Engineer',
    'Interior & Architecture Designer': 'Interior & Architecture Designer',
    'VR/AR Developer': 'VR/AR Developer',
    'Game Designer': 'Game Designer',
    'Game Animator': 'Game Animator',
    'Game Artist': 'Game Artist',
    'Game Developer': 'Game Developer',
    Photographer: 'Photographer',
    'Multimedia Arts': 'Multimedia Arts',
    Other: 'Other',
    changeCover: 'Change Cover',
    changePhoto: 'Change Photo',
    squareCrop: 'Square Crop',
    circleCrop: 'Circle Crop',
    fullName: 'Full Name',
    usernameHandle: 'Username/Handle',
    bio: 'Bio',
    yearOfStudy: 'Year of Study',
    profession: 'Profession',
    linkedinUrl: 'LinkedIn URL',
    portfolioUrl: 'Portfolio URL',
    openToWorkBadgeHint: 'When enabled, profile gets green OPEN TO WORK badge.',
    saveProfile: 'Save Profile',
    updatePassword: 'Update Password',
    currentEmailMasked: 'Current email (masked)',
    newEmail: 'New email',
    passwordConfirmation: 'Password confirmation',
    updateEmail: 'Update Email',
    changePassword: 'Change Password',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmNewPassword: 'Confirm new password',
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong',
    dangerZone: 'Danger Zone',
    deleteAccount: 'Delete Account',
    emailConfirmation: 'Email confirmation',
    cancel: 'Cancel',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    language: 'Language',
    savePreferences: 'Save Preferences',
    welcomeBack: 'Welcome back',
    welcomeToGallery: 'Welcome to MMS Gallery',
    avatarMaxSize3mb: 'Avatar max size is 3MB',
    coverMaxSize5mb: 'Cover max size is 5MB',
    noBioProvided: 'No bio provided.',
    noPortfolioItemsYet: 'This profile has not published portfolio items yet.',
    uploadYourFirstWork: 'Upload your first work →',
    followed: 'Followed',
    unfollowed: 'Unfollowed',
    editAvatar: 'Edit avatar',
    editProfile: 'Edit Profile',
    message: 'Message',
    portfolio: 'Portfolio',
    about: 'About',
    memberSince: 'Member since',
    notSpecified: 'Not specified',
    newFollower: 'New follower',
    someoneLikedYourWork: 'Someone liked your work',
    someoneCommentedOnYourWork: 'Someone commented on your work',
    yourWorkWasApproved: 'Your work was approved',
    yourWorkWasRejected: 'Your work was rejected',
    platformAnnouncements: 'Platform announcements',
    showEmailOnProfile: 'Show email on profile',
    showInOpenToWorkTab: 'Show in Open to Work tab',
    allowFollowers: 'Allow followers',
    showFollowerCountPublicly: 'Show follower count publicly',
    allProfessions: 'All professions',
    openToWorkOnly: 'Open to work only',
    closedToWork: 'Closed to work',
    searchByTitleOrAuthor: 'Search by title or author...',
    searchByNameOrEmail: 'Search by name or email...',
    reviewPendingWorks: 'Review Pending Works',
    viewStudents: 'View Students',
    artworkStatus: 'Artwork Status',
    quickActions: 'Quick Actions',
    noArtworksFound: 'No artworks found.',
    noStudentsYet: 'No students yet.',
    noFeedbackYet: 'No feedback submissions yet.',
    noFollowsYet: 'No follow relationships yet.',
    noWorksYet: 'No works yet.',
    noWorksSubmittedYet: 'No works submitted yet.',
    noCommentsYet: 'No comments yet.',
    noProfilesMatched: 'No profiles matched the selected filters.',
    clickToUpload: 'Click to upload',
    titleAndCategoryRequired: 'Title and category are required',
    workSubmittedSuccessfully: 'Work submitted successfully!',
    profileUpdated: 'Profile updated!',
    artworkDeleted: 'Artwork deleted',
    statusUpdatedTo: 'Status updated to',
    artworkFeatured: 'Artwork featured!',
    artworkUnfeatured: 'Artwork unfeatured',
    coverUpdated: 'Cover updated',
    coverPresetApplied: 'Cover preset applied',
    accountDeleted: 'Account deleted',
    feature: 'Feature',
    studentRemoved: 'Student removed',
    feedbackRemoved: 'Feedback removed',
    savedSuccessfully: '✓ Saved successfully',
    changesSaved: '✓ Changes saved',
    saving: 'Saving...',
    fullNameRequired: 'Full Name is required',
    enterAllFields: 'Please fill in all fields',
    passwordsDoNotMatch: 'Passwords do not match',
    passwordTooShort: 'Password must be at least 6 characters',
    emailAndPasswordRequired: 'Email and password are required',
    nameEmailPasswordAndProfessionRequired: 'Name, email, password and profession are required',
    bioShortHint: 'Short Bio (optional)',
    professionSpecialization: 'Profession / Specialization',
    selectProfession: 'Select Profession',
    selectYear: 'Select Year',
    selectCategory: 'Select a category',
    selectMajor: 'Select Major',
    projectTitle: 'Project Title *',
    category: 'Category *',
    description: 'Description',
    tagsCommaSeparated: 'Tags (comma separated)',
    uploadImage: 'Upload Image *',
    submitForReview: 'Submit for Review',
    backToGallery: 'Back to Gallery',
    createAccount: 'Create Account',
    alreadyHaveAccount: 'Already have an account',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    emailAddress: 'Email Address',
    password: 'Password',
    confirm: 'Confirm',
    or: 'or',
    topArtists: 'Top Artists',
    community: 'Community',
    leaderboard: 'Leaderboard',
    allProfiles: 'All profiles',
    availableTalentTitle: 'Available Talent',
    availableTalent: 'Browse students who are available for collaboration, internships, and project-based work.',
    recruiterview: 'Recruiter view',
    openToWorkTitle: 'Open to Work',
    galleryTitle: 'Gallery',
    dashboard: 'Dashboard'
  },
  ru: {
    'Digital Art': 'Цифровое искусство',
    '3D': '3D',
    Animation: 'Анимация',
    Photography: 'Фотография',
    VFX: 'VFX',
    'UX/UI': 'UX/UI',
    'Game Art': 'Игровой арт',
    Illustration: 'Иллюстрация',
    Video: 'Видео',
    Interactive: 'Интерактив',
    'Digital Artist': 'Цифровой художник',
    '3D Artist': '3D-художник',
    'Motion Designer': 'Моушн-дизайнер',
    Illustrator: 'Иллюстратор',
    Videographer: 'Видеограф',
    '1st Year': '1-й курс',
    '2nd Year': '2-й курс',
    '3rd Year': '3-й курс',
    '4th Year': '4-й курс',
    Graduate: 'Выпускник',
    Master: 'Магистратура',
    '3D Modeler': '3D-моделлер',
    '3D/2D Animator': '3D/2D аниматор',
    'VFX Artist': 'VFX-художник',
    'Film Editor': 'Киномонтажер',
    'Graphic Designer': 'Графический дизайнер',
    'UX/UI Designer': 'UX/UI-дизайнер',
    'IoT Engineer': 'Инженер IoT',
    'Interior & Architecture Designer': 'Дизайнер интерьера и архитектуры',
    'VR/AR Developer': 'VR/AR-разработчик',
    'Game Designer': 'Гейм-дизайнер',
    'Game Animator': 'Гейм-аниматор',
    'Game Artist': 'Художник игр',
    'Game Developer': 'Разработчик игр',
    Photographer: 'Фотограф',
    'Multimedia Arts': 'Мультимедийное искусство',
    Other: 'Другое',
    changeCover: 'Изменить обложку',
    changePhoto: 'Изменить фото',
    squareCrop: 'Квадратный кроп',
    circleCrop: 'Круглый кроп',
    fullName: 'Полное имя',
    usernameHandle: 'Имя пользователя',
    bio: 'О себе',
    yearOfStudy: 'Год обучения',
    profession: 'Профессия',
    linkedinUrl: 'LinkedIn URL',
    portfolioUrl: 'Portfolio URL',
    openToWorkBadgeHint: 'При включении профиль получает зелёный бейдж OPEN TO WORK.',
    saveProfile: 'Сохранить профиль',
    updatePassword: 'Обновить пароль',
    currentEmailMasked: 'Текущая почта (скрыта)',
    newEmail: 'Новая почта',
    passwordConfirmation: 'Подтверждение пароля',
    updateEmail: 'Обновить почту',
    changePassword: 'Сменить пароль',
    currentPassword: 'Текущий пароль',
    newPassword: 'Новый пароль',
    confirmNewPassword: 'Подтвердите новый пароль',
    weak: 'Слабый',
    medium: 'Средний',
    strong: 'Сильный',
    dangerZone: 'Опасная зона',
    deleteAccount: 'Удалить аккаунт',
    emailConfirmation: 'Подтверждение почты',
    cancel: 'Отмена',
    lightMode: 'Светлая тема',
    darkMode: 'Тёмная тема',
    language: 'Язык',
    savePreferences: 'Сохранить настройки',
    welcomeBack: 'С возвращением',
    welcomeToGallery: 'Добро пожаловать в MMS Gallery',
    avatarMaxSize3mb: 'Максимальный размер аватара 3 МБ',
    coverMaxSize5mb: 'Максимальный размер обложки 5 МБ',
    noBioProvided: 'Биография не указана.',
    noPortfolioItemsYet: 'У этого профиля пока нет опубликованных работ.',
    uploadYourFirstWork: 'Загрузить первую работу →',
    followed: 'Подписано',
    unfollowed: 'Отписано',
    editAvatar: 'Редактировать аватар',
    editProfile: 'Редактировать профиль',
    message: 'Сообщение',
    portfolio: 'Портфолио',
    about: 'О себе',
    memberSince: 'Участник с',
    notSpecified: 'Не указано',
    newFollower: 'Новый подписчик',
    someoneLikedYourWork: 'Кому-то понравилась ваша работа',
    someoneCommentedOnYourWork: 'Кто-то прокомментировал вашу работу',
    yourWorkWasApproved: 'Ваша работа одобрена',
    yourWorkWasRejected: 'Ваша работа отклонена',
    platformAnnouncements: 'Объявления платформы',
    showEmailOnProfile: 'Показывать почту в профиле',
    showInOpenToWorkTab: 'Показывать в разделе Open to Work',
    allowFollowers: 'Разрешить подписки',
    showFollowerCountPublicly: 'Показывать число подписчиков публично',
    allProfessions: 'Все профессии',
    openToWorkOnly: 'Только Open to work',
    closedToWork: 'Не открыт к работе',
    searchByTitleOrAuthor: 'Поиск по названию или автору...',
    searchByNameOrEmail: 'Поиск по имени или почте...',
    reviewPendingWorks: 'Проверить работы',
    viewStudents: 'Посмотреть студентов',
    artworkStatus: 'Статус работ',
    quickActions: 'Быстрые действия',
    noArtworksFound: 'Работы не найдены.',
    noStudentsYet: 'Пока нет студентов.',
    noFeedbackYet: 'Пока нет обращений.',
    noFollowsYet: 'Пока нет связей подписки.',
    noWorksYet: 'Работ пока нет.',
    noWorksSubmittedYet: 'Пока нет отправленных работ.',
    noCommentsYet: 'Комментариев пока нет.',
    noProfilesMatched: 'Профили по выбранным фильтрам не найдены.',
    clickToUpload: 'Нажмите, чтобы загрузить',
    titleAndCategoryRequired: 'Название и категория обязательны',
    workSubmittedSuccessfully: 'Работа успешно отправлена!',
    profileUpdated: 'Профиль обновлён!',
    artworkDeleted: 'Работа удалена',
    statusUpdatedTo: 'Статус изменён на',
    artworkFeatured: 'Работа добавлена в избранное!',
    artworkUnfeatured: 'Работа убрана из избранного',
    coverUpdated: 'Обложка обновлена',
    coverPresetApplied: 'Пресет обложки применён',
    accountDeleted: 'Аккаунт удалён',
    feature: 'Выделить',
    studentRemoved: 'Студент удалён',
    feedbackRemoved: 'Обращение удалено',
    savedSuccessfully: '✓ Сохранено успешно',
    changesSaved: '✓ Изменения сохранены',
    saving: 'Сохранение...',
    fullNameRequired: 'Полное имя обязательно',
    enterAllFields: 'Пожалуйста, заполните все поля',
    passwordsDoNotMatch: 'Пароли не совпадают',
    passwordTooShort: 'Пароль должен быть не короче 6 символов',
    emailAndPasswordRequired: 'Почта и пароль обязательны',
    nameEmailPasswordAndProfessionRequired: 'Имя, почта, пароль и профессия обязательны',
    bioShortHint: 'Краткая биография (необязательно)',
    professionSpecialization: 'Профессия / специализация',
    selectProfession: 'Выберите профессию',
    selectYear: 'Выберите курс',
    selectCategory: 'Выберите категорию',
    selectMajor: 'Выберите направление',
    projectTitle: 'Название проекта *',
    category: 'Категория *',
    description: 'Описание',
    tagsCommaSeparated: 'Теги (через запятую)',
    uploadImage: 'Загрузить изображение *',
    submitForReview: 'Отправить на проверку',
    backToGallery: 'Назад в галерею',
    createAccount: 'Создать аккаунт',
    alreadyHaveAccount: 'Уже есть аккаунт',
    signIn: 'Войти',
    signUp: 'Регистрация',
    emailAddress: 'Электронная почта',
    password: 'Пароль',
    confirm: 'Подтвердить',
    or: 'или',
    topArtists: 'Лучшие авторы',
    community: 'Сообщество',
    leaderboard: 'Рейтинг',
    allProfiles: 'Все профили',
    availableTalentTitle: 'Доступные таланты',
    availableTalent: 'Просматривайте студентов, доступных для сотрудничества, стажировок и проектной работы.',
    recruiterview: 'Вид рекрутера',
    openToWorkTitle: 'Open to Work',
    galleryTitle: 'Галерея',
    dashboard: 'Панель'
  },
  kk: {
    'Digital Art': 'Цифрлық өнер',
    '3D': '3D',
    Animation: 'Анимация',
    Photography: 'Фотография',
    VFX: 'VFX',
    'UX/UI': 'UX/UI',
    'Game Art': 'Ойын өнері',
    Illustration: 'Иллюстрация',
    Video: 'Бейне',
    Interactive: 'Интерактив',
    'Digital Artist': 'Цифрлық суретші',
    '3D Artist': '3D суретші',
    'Motion Designer': 'Моушн-дизайнер',
    Illustrator: 'Иллюстратор',
    Videographer: 'Видеограф',
    '1st Year': '1-курс',
    '2nd Year': '2-курс',
    '3rd Year': '3-курс',
    '4th Year': '4-курс',
    Graduate: 'Түлек',
    Master: 'Магистратура',
    '3D Modeler': '3D-модельер',
    '3D/2D Animator': '3D/2D аниматор',
    'VFX Artist': 'VFX суретші',
    'Film Editor': 'Киномонтажер',
    'Graphic Designer': 'Графикалық дизайнер',
    'UX/UI Designer': 'UX/UI дизайнер',
    'IoT Engineer': 'IoT инженер',
    'Interior & Architecture Designer': 'Интерьер және архитектура дизайнері',
    'VR/AR Developer': 'VR/AR әзірлеуші',
    'Game Designer': 'Ойын дизайнері',
    'Game Animator': 'Ойын аниматоры',
    'Game Artist': 'Ойын суретшісі',
    'Game Developer': 'Ойын әзірлеуші',
    Photographer: 'Фотограф',
    'Multimedia Arts': 'Мультимедиалық өнер',
    Other: 'Басқа',
    changeCover: 'Мұқабаны өзгерту',
    changePhoto: 'Фотоны өзгерту',
    squareCrop: 'Квадратты қиып алу',
    circleCrop: 'Дөңгелек қиып алу',
    fullName: 'Толық аты-жөні',
    usernameHandle: 'Пайдаланушы аты',
    bio: 'Өзім туралы',
    yearOfStudy: 'Оқу жылы',
    profession: 'Мамандық',
    linkedinUrl: 'LinkedIn URL',
    portfolioUrl: 'Portfolio URL',
    openToWorkBadgeHint: 'Қосылған кезде профильде жасыл OPEN TO WORK белгісі пайда болады.',
    saveProfile: 'Профильді сақтау',
    updatePassword: 'Құпиясөзді жаңарту',
    currentEmailMasked: 'Ағымдағы пошта (жасырылған)',
    newEmail: 'Жаңа пошта',
    passwordConfirmation: 'Құпиясөзді растау',
    updateEmail: 'Поштаны жаңарту',
    changePassword: 'Құпиясөзді өзгерту',
    currentPassword: 'Ағымдағы құпиясөз',
    newPassword: 'Жаңа құпиясөз',
    confirmNewPassword: 'Жаңа құпиясөзді растаңыз',
    weak: 'Әлсіз',
    medium: 'Орташа',
    strong: 'Күшті',
    dangerZone: 'Қауіпті аймақ',
    deleteAccount: 'Аккаунтты жою',
    emailConfirmation: 'Поштаны растау',
    cancel: 'Бас тарту',
    lightMode: 'Ашық режим',
    darkMode: 'Қараңғы режим',
    language: 'Тіл',
    savePreferences: 'Баптауларды сақтау',
    welcomeBack: 'Қайта қош келдіңіз',
    welcomeToGallery: 'MMS Gallery платформасына қош келдіңіз',
    avatarMaxSize3mb: 'Аватардың ең үлкен көлемі 3 МБ',
    coverMaxSize5mb: 'Мұқабаның ең үлкен көлемі 5 МБ',
    noBioProvided: 'Био көрсетілмеген.',
    noPortfolioItemsYet: 'Бұл профильде әлі жарияланған жұмыстар жоқ.',
    uploadYourFirstWork: 'Алғашқы жұмысыңызды жүктеңіз →',
    followed: 'Жазылды',
    unfollowed: 'Жазылудан шықты',
    editAvatar: 'Аватарды өңдеу',
    editProfile: 'Профильді өңдеу',
    message: 'Хабарлама',
    portfolio: 'Портфолио',
    about: 'Өзім туралы',
    memberSince: 'Мүшесі болған кезі',
    notSpecified: 'Көрсетілмеген',
    newFollower: 'Жаңа жазылушы',
    someoneLikedYourWork: 'Біреу сіздің жұмысыңызды ұнатты',
    someoneCommentedOnYourWork: 'Біреу жұмысыңызға пікір қалдырды',
    yourWorkWasApproved: 'Жұмысыңыз бекітілді',
    yourWorkWasRejected: 'Жұмысыңыз қабылданбады',
    platformAnnouncements: 'Платформа хабарландырулары',
    showEmailOnProfile: 'Профильде поштаны көрсету',
    showInOpenToWorkTab: 'Open to Work бөлімінде көрсету',
    allowFollowers: 'Жазылушыларға рұқсат беру',
    showFollowerCountPublicly: 'Жазылушылар санын ашық көрсету',
    allProfessions: 'Барлық мамандықтар',
    openToWorkOnly: 'Тек Open to work',
    closedToWork: 'Жұмысқа ашық емес',
    searchByTitleOrAuthor: 'Атауы немесе авторы бойынша іздеу...',
    searchByNameOrEmail: 'Аты немесе поштасы бойынша іздеу...',
    reviewPendingWorks: 'Күтудегі жұмыстарды қарау',
    viewStudents: 'Студенттерді көру',
    artworkStatus: 'Жұмыстардың күйі',
    quickActions: 'Жылдам әрекеттер',
    noArtworksFound: 'Жұмыстар табылмады.',
    noStudentsYet: 'Әзірге студенттер жоқ.',
    noFeedbackYet: 'Кері байланыс әлі жоқ.',
    noFollowsYet: 'Жазылу байланыстары әлі жоқ.',
    noWorksYet: 'Жұмыс әлі жоқ.',
    noWorksSubmittedYet: 'Әлі жүктелген жұмыс жоқ.',
    noCommentsYet: 'Әзірге пікір жоқ.',
    noProfilesMatched: 'Таңдалған сүзгілерге сәйкес профиль табылмады.',
    clickToUpload: 'Жүктеу үшін басыңыз',
    titleAndCategoryRequired: 'Атауы мен санаты міндетті',
    workSubmittedSuccessfully: 'Жұмыс сәтті жіберілді!',
    profileUpdated: 'Профиль жаңартылды!',
    artworkDeleted: 'Жұмыс жойылды',
    statusUpdatedTo: 'Күйі мынаған өзгертілді',
    artworkFeatured: 'Жұмыс таңдаулыға қосылды!',
    artworkUnfeatured: 'Жұмыс таңдаулыдан алынды',
    coverUpdated: 'Мұқаба жаңартылды',
    coverPresetApplied: 'Мұқаба үлгісі қолданылды',
    accountDeleted: 'Аккаунт жойылды',
    feature: 'Белгілеу',
    studentRemoved: 'Студент жойылды',
    feedbackRemoved: 'Кері байланыс жойылды',
    savedSuccessfully: '✓ Сәтті сақталды',
    changesSaved: '✓ Өзгерістер сақталды',
    saving: 'Сақталуда...',
    fullNameRequired: 'Толық аты-жөні міндетті',
    enterAllFields: 'Барлық өрістерді толтырыңыз',
    passwordsDoNotMatch: 'Құпиясөздер сәйкес келмейді',
    passwordTooShort: 'Құпиясөз кемінде 6 таңбадан тұруы керек',
    emailAndPasswordRequired: 'Пошта мен құпиясөз міндетті',
    nameEmailPasswordAndProfessionRequired: 'Аты, поштасы, құпиясөзі және мамандығы міндетті',
    bioShortHint: 'Қысқа био (міндетті емес)',
    professionSpecialization: 'Мамандық / бағыт',
    selectProfession: 'Мамандық таңдаңыз',
    selectYear: 'Оқу жылын таңдаңыз',
    selectCategory: 'Санатты таңдаңыз',
    selectMajor: 'Бағытты таңдаңыз',
    projectTitle: 'Жоба атауы *',
    category: 'Санат *',
    description: 'Сипаттама',
    tagsCommaSeparated: 'Тегтер (үтір арқылы)',
    uploadImage: 'Сурет жүктеу *',
    submitForReview: 'Тексеруге жіберу',
    backToGallery: 'Галереяға оралу',
    createAccount: 'Аккаунт құру',
    alreadyHaveAccount: 'Аккаунтыңыз бар ма',
    signIn: 'Кіру',
    signUp: 'Тіркелу',
    emailAddress: 'Электрондық пошта',
    password: 'Құпиясөз',
    confirm: 'Растау',
    or: 'немесе',
    topArtists: 'Үздік авторлар',
    community: 'Қауымдастық',
    leaderboard: 'Көшбасшылар тізімі',
    allProfiles: 'Барлық профильдер',
    availableTalentTitle: 'Қолжетімді таланттар',
    availableTalent: 'Ынтымақтастыққа, тағылымдамаға және жобалық жұмысқа қолжетімді студенттерді қараңыз.',
    recruiterview: 'Рекрутер көрінісі',
    openToWorkTitle: 'Open to Work',
    galleryTitle: 'Галерея',
    dashboard: 'Басқару тақтасы'
  }
};

Object.keys(EXTRA_I18N).forEach((lang) => {
  Object.assign(I18N[lang], EXTRA_I18N[lang]);
});

const EXACT_TEXT_KEYS = {
  'All': 'all',
  'Home': 'home',
  'Gallery': 'gallery',
  'Artists': 'artists',
  'Hire': 'hire',
  'Contact': 'contact',
  'Login': 'login',
  'Sign Up': 'signup',
  'Logout': 'logout',
  'Load More Works': 'loadMore',
  'No works found for this filter.': 'noWorksFilter',
  'Following Feed': 'followingFeed',
  'All Works': 'allWorks',
  'Follow': 'follow',
  'Unfollow': 'unfollow',
  'Open to Work': 'openToWork',
  'Change Cover': 'changeCover',
  'Change Photo': 'changePhoto',
  'Square Crop': 'squareCrop',
  'Circle Crop': 'circleCrop',
  'Full Name': 'fullName',
  'Username/Handle': 'usernameHandle',
  'Bio': 'bio',
  'Year of Study': 'yearOfStudy',
  'Profession': 'profession',
  'LinkedIn URL': 'linkedinUrl',
  'Portfolio URL': 'portfolioUrl',
  'Save Profile': 'saveProfile',
  'Profile': 'profile',
  'Account': 'account',
  'Appearance': 'appearance',
  'Privacy': 'privacy',
  '+ Upload New Work': 'uploadNewWork',
  'Delete': 'delete',
  'Approved': 'approved',
  'Pending': 'pending',
  'Rejected': 'rejected',
  'Total Works': 'totalWorks',
  'Total Likes': 'totalLikes',
  'Current email (masked)': 'currentEmailMasked',
  'New email': 'newEmail',
  'Password confirmation': 'passwordConfirmation',
  'Your Name': 'yourName',
  'Min. 6 chars': 'min6Chars',
  'Repeat': 'repeatPassword',
  'Update Email': 'updateEmail',
  'Change Password': 'changePassword',
  'Current password': 'currentPassword',
  'New password': 'newPassword',
  'Confirm new password': 'confirmNewPassword',
  'Weak': 'weak',
  'Medium': 'medium',
  'Strong': 'strong',
  'Danger Zone': 'dangerZone',
  'Delete Account': 'deleteAccount',
  'Email confirmation': 'emailConfirmation',
  'Cancel': 'cancel',
  'Light Mode': 'lightMode',
  'Dark Mode': 'darkMode',
  'Language': 'language',
  'Save Preferences': 'savePreferences',
  'Sending...': 'sending',
  'Feedback sent': 'feedbackSent',
  'Thank you. Your feedback has been sent successfully.': 'feedbackThanks',
  'All professions': 'allProfessions',
  'Open to work: all': 'allProfessions',
  'Open to work only': 'openToWorkOnly',
  'Closed to work': 'closedToWork',
  'Search by title or author...': 'searchByTitleOrAuthor',
  'Search by name or email...': 'searchByNameOrEmail',
  'Review Pending Works': 'reviewPendingWorks',
  'View Students': 'viewStudents',
  'Artwork Status': 'artworkStatus',
  'Quick Actions': 'quickActions',
  'No artworks found.': 'noArtworksFound',
  'No students yet.': 'noStudentsYet',
  'No feedback submissions yet.': 'noFeedbackYet',
  'No follow relationships yet.': 'noFollowsYet',
  'No works yet.': 'noWorksYet',
  'No works submitted yet.': 'noWorksSubmittedYet',
  'No profiles matched the selected filters.': 'noProfilesMatched',
  'Click to upload': 'clickToUpload',
  'Title and category are required': 'titleAndCategoryRequired',
  'Work submitted successfully!': 'workSubmittedSuccessfully',
  'Profile updated!': 'profileUpdated',
  'Artwork deleted': 'artworkDeleted',
  'Artwork featured!': 'artworkFeatured',
  'Artwork unfeatured': 'artworkUnfeatured',
  'Cover updated': 'coverUpdated',
  'Cover preset applied': 'coverPresetApplied',
  'Account deleted': 'accountDeleted',
  '✓ Saved successfully': 'savedSuccessfully',
  '✓ Changes saved': 'changesSaved',
  'Saving...': 'saving',
  'Full Name is required': 'fullNameRequired',
  'Please fill in all fields': 'enterAllFields',
  'Passwords do not match': 'passwordsDoNotMatch',
  'Password must be at least 6 characters': 'passwordTooShort',
  'Name, email, password and profession are required': 'nameEmailPasswordAndProfessionRequired',
  'View All': 'view_all',
  'Submit Your Work': 'btn_submit',
  'Student Spotlight': 'student_spotlight',
  'Projects': 'stat_projects',
  'Students': 'stat_students',
  'Categories': 'stat_categories'
};

const UI_TEXT_TRANSLATIONS = {
  ru: {
    'Login': 'Вход',
    'Sign Up': 'Регистрация',
    'Sign In': 'Войти',
    'Create Account': 'Создать аккаунт',
    'Already have an account': 'Уже есть аккаунт',
    'Back to Gallery': 'Назад в галерею',
    'Email Address': 'Электронная почта',
    'Password': 'Пароль',
    'Full Name': 'Полное имя',
    'Year': 'Курс',
    'Profession / Specialization': 'Профессия / специализация',
    'Confirm': 'Подтверждение',
    'Short Bio (optional)': 'Краткая биография (необязательно)',
    'or': 'или',
    'Get In Touch': 'Свяжитесь с нами',
    "Have questions? We'd love to hear from you.": 'Есть вопросы? Мы будем рады вашему сообщению.',
    '/ CONTACT US': '/ СВЯЖИТЕСЬ С НАМИ',
    'CONTACT INFO': 'КОНТАКТЫ',
    'Name': 'Имя',
    'Email': 'Почта',
    'Subject': 'Тема',
    'Message': 'Сообщение',
    'Send': 'Отправить',
    'General Question': 'Общий вопрос',
    'Bug Report': 'Сообщение об ошибке',
    'Collaboration': 'Сотрудничество',
    'Other': 'Другое',
    'Feedback': 'Обратная связь',
    'Contact Us': 'Связаться с нами',
    'Open to Work': 'Открыт к работе',
    'Save Preferences': 'Сохранить настройки',
    'Save Profile': 'Сохранить профиль',
    'Update Email': 'Обновить почту',
    'Update Password': 'Обновить пароль',
    'Delete Account': 'Удалить аккаунт',
    'Cancel': 'Отмена',
    'Film Editor': 'Киномонтажер',
    'Photographer': 'Фотограф',
    'Interior Designer': 'Дизайнер интерьера'
  },
  kk: {
    'Login': 'Кіру',
    'Sign Up': 'Тіркелу',
    'Sign In': 'Кіру',
    'Create Account': 'Аккаунт құру',
    'Already have an account': 'Аккаунтыңыз бар ма',
    'Back to Gallery': 'Галереяға оралу',
    'Email Address': 'Электрондық пошта',
    'Password': 'Құпиясөз',
    'Full Name': 'Толық аты-жөні',
    'Year': 'Оқу жылы',
    'Profession / Specialization': 'Мамандық / бағыт',
    'Confirm': 'Растау',
    'Short Bio (optional)': 'Қысқа био (міндетті емес)',
    'or': 'немесе',
    'Get In Touch': 'Бізбен байланысыңыз',
    "Have questions? We'd love to hear from you.": 'Сұрақтарыңыз бар ма? Бізге жазуыңызға қуаныштымыз.',
    '/ CONTACT US': '/ БІЗБЕН БАЙЛАНЫС',
    'CONTACT INFO': 'БАЙЛАНЫС АҚПАРАТЫ',
    'Name': 'Аты',
    'Email': 'Пошта',
    'Subject': 'Тақырып',
    'Message': 'Хабарлама',
    'Send': 'Жіберу',
    'General Question': 'Жалпы сұрақ',
    'Bug Report': 'Қате туралы хабарлама',
    'Collaboration': 'Ынтымақтастық',
    'Other': 'Басқа',
    'Feedback': 'Кері байланыс',
    'Contact Us': 'Бізбен байланыс',
    'Open to Work': 'Жұмысқа ашық',
    'Save Preferences': 'Баптауларды сақтау',
    'Save Profile': 'Профильді сақтау',
    'Update Email': 'Поштаны жаңарту',
    'Update Password': 'Құпиясөзді жаңарту',
    'Delete Account': 'Аккаунтты жою',
    'Cancel': 'Бас тарту',
    'Film Editor': 'Киномонтажер',
    'Photographer': 'Фотограф',
    'Interior Designer': 'Интерьер дизайнері'
  }
};

const UI_PLACEHOLDER_TRANSLATIONS = {
  ru: {
    'your@university.edu': 'your@university.edu',
    'Your Name': 'Ваше имя',
    'Min. 6 chars': 'Минимум 6 символов',
    'Repeat': 'Повторите',
    'Enter your password': 'Введите пароль',
    'Tell us about yourself...': 'Расскажите немного о себе...',
    'name@sdu.edu.kz': 'name@sdu.edu.kz',
    'Current password': 'Текущий пароль',
    'your@email.com': 'your@email.com'
  },
  kk: {
    'your@university.edu': 'your@university.edu',
    'Your Name': 'Атыңыз',
    'Min. 6 chars': 'Кемінде 6 таңба',
    'Repeat': 'Қайталаңыз',
    'Enter your password': 'Құпиясөзді енгізіңіз',
    'Tell us about yourself...': 'Өзіңіз туралы қысқаша жазыңыз...',
    'name@sdu.edu.kz': 'name@sdu.edu.kz',
    'Current password': 'Ағымдағы құпиясөз',
    'your@email.com': 'your@email.com'
  }
};

function detectBrowserLanguage() {
  const browserLang = (navigator.language || 'en').toLowerCase();
  if (browserLang.startsWith('ru')) return 'ru';
  if (browserLang.startsWith('kk') || browserLang.startsWith('kz')) return 'kk';
  return 'en';
}

function getLanguage() {
  const saved = localStorage.getItem(I18N_KEY);
  if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
  return detectBrowserLanguage();
}

function setLanguage(lang) {
  const next = SUPPORTED_LANGS.includes(lang) ? lang : 'en';
  localStorage.setItem(I18N_KEY, next);
  updateNavAuth();
  applyTranslations();
}

function changeLanguage(lang) {
  setLanguage(lang);
}

async function loadI18nDictionaries() {
  const loaded = {};
  for (const lang of SUPPORTED_LANGS) {
    const path = I18N_ASSET_PATHS[lang];
    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`Failed to load ${path}`);
      loaded[lang] = await response.json();
    } catch {
      loaded[lang] = {};
    }
  }
  I18N_FILES = loaded;
}

function t(key) {
  const lang = getLanguage();
  return I18N_FILES[lang]?.[key] || I18N[lang]?.[key] || I18N_FILES.en?.[key] || I18N.en[key] || key;
}

function applyTranslations() {
  const lang = getLanguage();
  document.documentElement.setAttribute('lang', lang);

  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.getAttribute('data-i18n');
    node.textContent = t(key);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
    const key = node.getAttribute('data-i18n-placeholder');
    node.setAttribute('placeholder', t(key));
  });

  // Exact-text translation fallback for static markup not annotated with data-i18n.
  document.querySelectorAll('button, a, h1, h2, h3, h4, p, span, label, option, th').forEach((node) => {
    if (node.children.length > 0) return;
    const raw = (node.textContent || '').trim();
    const key = EXACT_TEXT_KEYS[raw];
    if (key) node.textContent = t(key);
  });

  // Additional phrase-level translation map for broader RU/KK coverage across pages.
  const phraseMap = UI_TEXT_TRANSLATIONS[lang] || {};
  document.querySelectorAll('button, a, h1, h2, h3, h4, h5, h6, p, span, label, option, legend').forEach((node) => {
    if (node.children.length > 0) return;
    const raw = (node.textContent || '').trim();
    if (!raw) return;
    const translated = phraseMap[raw];
    if (translated) node.textContent = translated;
  });

  const placeholderMap = UI_PLACEHOLDER_TRANSLATIONS[lang] || {};
  document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach((node) => {
    const ph = node.getAttribute('placeholder') || '';
    const translated = placeholderMap[ph.trim()];
    if (translated) node.setAttribute('placeholder', translated);
  });

  // Translate common nav links even if a page doesn't use data-i18n attributes.
  document.querySelectorAll('nav .nav-links a').forEach((link) => {
    let href = link.getAttribute('href') || '';
    if (!href) return;

    // Normalize absolute links to path-only values.
    if (href.startsWith('http://') || href.startsWith('https://')) {
      try {
        href = new URL(href).pathname;
      } catch {
        return;
      }
    }

    if (href === '/' || href === '/#home') {
      link.textContent = t('home');
      return;
    }

    if (href === '/gallery' || href === '/#gallery') {
      link.textContent = t('gallery');
      return;
    }

    if (href === '/artists' || href === '/#artists') {
      link.textContent = t('artists');
      return;
    }

    if (href === '/hire') {
      link.textContent = t('hire');
      return;
    }

    if (href === '/contact') {
      link.textContent = t('contact');
    }
  });
}

function renderGlobalFooter() {
  const footer = document.querySelector('footer');
  if (!footer) return;

  footer.innerHTML = `
    <div class="footer-content">
      <div class="footer-col">
        <h4>${t('aboutMms')}</h4>
        <p>${t('aboutText')}</p>
      </div>
      <div class="footer-col">
        <h4>${t('quickLinks')}</h4>
        <p><a href="/gallery">${t('gallery')}</a></p>
        <p><a href="/artists">${t('artists')}</a></p>
        <p><a href="/hire">${t('hire')}</a></p>
        <p><a href="/dashboard?tab=submit">${t('submitWork')}</a></p>
        <p><a href="/auth">${t('login')}</a></p>
      </div>
      <div class="footer-col">
        <h4>${t('contactUs')}</h4>
        <p><a href="mailto:info@sdu.edu.kz">info@sdu.edu.kz</a></p>
        <p>+7 (727) 307 95 65</p>
        <address>SDU University, Almaty, Abylai Khan str. 1/1, Kaskelen 040900</address>
      </div>
      <div class="footer-col">
        <h4>${t('followUs')}</h4>
        <p><a href="https://www.instagram.com/sdu.mms/" target="_blank" rel="noreferrer">Instagram</a></p>
        <p><a href="https://www.tiktok.com/@sdukz" target="_blank" rel="noreferrer">TikTok</a></p>
      </div>
    </div>
    <div class="footer-bottom">
      <span>${t('footerCopy')}</span>
    </div>
  `;
}

async function loadNotifications() {
  if (!isLoggedIn()) return [];
  try {
    return await apiFetch('/api/notifications');
  } catch {
    return [];
  }
}

function formatNotification(item) {
  const actor = item.from_user_name || 'Someone';
  if (item.type === 'like') return `${actor} liked your work`;
  if (item.type === 'follow') return `${actor} started following you`;
  return `${actor} sent an update`;
}

function initTheme() {
  const savedTheme = localStorage.getItem('mms_theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  updateThemeIcon();
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme')
    || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const newTheme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('mms_theme', newTheme);
  updateThemeIcon();
}

function updateThemeIcon() {
  const theme = document.documentElement.getAttribute('data-theme')
    || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const btns = document.querySelectorAll('.theme-toggle');
  btns.forEach(btn => {
    btn.innerHTML = theme === 'dark' ? '&#9728;' : '&#9790;';
  });
}

/* ── Toast ── */
let toastTimer;
function toast(msg, type = 'info') {
  let el = document.getElementById('toast');
  if (!el) { 
    el = document.createElement('div'); 
    el.id = 'toast'; 
    document.body.appendChild(el); 
  }
  el.textContent = msg;
  el.className = 'show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.className = '', 3000);
}

/* ── Nav scroll ── */
function initNavScroll() {
  const nav = document.querySelector('nav');
  if (!nav) return;
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 50));
}

/* ── Auth helpers ── */
const API = '';  // same origin

function getToken() {
  const token = localStorage.getItem('mms_token');
  if (token && !document.cookie.includes('mms_token=')) {
    document.cookie = `mms_token=${encodeURIComponent(token)}; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`;
  }
  return token;
}
function getUser() { 
  try { 
    return JSON.parse(localStorage.getItem('mms_user')); 
  } catch { 
    return null; 
  } 
}
function setAuth(token, user) {
  localStorage.setItem('mms_token', token);
  localStorage.setItem('mms_user', JSON.stringify(user));
  document.cookie = `mms_token=${encodeURIComponent(token)}; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`;
}
function clearAuth() { 
  localStorage.removeItem('mms_token'); 
  localStorage.removeItem('mms_user'); 
  document.cookie = 'mms_token=; Path=/; Max-Age=0; SameSite=Lax';
}
function isLoggedIn() { return !!getToken(); }

function avatarPlaceholder(name = 'U', size = 240) {
  const seed = encodeURIComponent(String(name || 'U').charAt(0).toUpperCase());
  return `https://placehold.co/${size}x${size}/2563eb/ffffff?text=${seed}`;
}

function resolveAvatarUrl(user, size = 240) {
  const fallback = avatarPlaceholder(user?.name || 'U', size);
  const raw = String(user?.avatar_url || '').trim();
  if (!raw) return fallback;
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
  return raw.startsWith('/') ? raw : `/${raw}`;
}

async function apiFetch(path, opts = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API + path, { ...opts, headers });
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
  if (!res.ok) throw new Error(data.error || text || `Request failed (${res.status})`);
  return data;
}

async function apiFetchForm(path, formData, method = 'POST') {
  const token = getToken();
  const headers = {};
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API + path, { method, headers, body: formData });
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
  if (!res.ok) throw new Error(data.error || text || `Request failed (${res.status})`);
  return data;
}

/* ── Nav auth state ── */
function updateNavAuth() {
  const user = getUser();
  const navRight = document.getElementById('navRight');
  if (!navRight) return;

  const lang = getLanguage();
  const langSelect = `
    <select class="form-select" style="padding:8px 10px;font-size:.8rem" onchange="changeLanguage(this.value)">
      <option value="kk" ${lang === 'kk' ? 'selected' : ''}>KZ</option>
      <option value="en" ${lang === 'en' ? 'selected' : ''}>EN</option>
      <option value="ru" ${lang === 'ru' ? 'selected' : ''}>RU</option>
    </select>
  `;
  
  const themeBtn = `<button class="theme-toggle" onclick="toggleTheme()" title="${t('toggleTheme')}"></button>`;
  
  // User account icon SVG
  const accountIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
  
  if (user) {
    const notificationMarkup = `
      <details class="notif" style="position:relative">
        <summary class="btn btn-ghost btn-sm" style="list-style:none;cursor:pointer">${t('notifications')}</summary>
        <div id="notifMenu" style="position:absolute;right:0;top:40px;min-width:260px;max-height:260px;overflow:auto;padding:10px;background:var(--card-bg);border:1px solid var(--border-color);border-radius:12px;box-shadow:var(--card-shadow-hover);z-index:120">${t('noNotifications')}</div>
      </details>
    `;

    navRight.innerHTML = `
      ${langSelect}
      ${themeBtn}
      ${notificationMarkup}
      <details class="account-menu" style="position:relative">
        <summary class="nav-account-btn" title="${t('myAccount')}" style="list-style:none">${accountIcon}</summary>
        <div style="position:absolute;right:0;top:46px;min-width:190px;background:var(--card-bg);border:1px solid var(--border-color);border-radius:12px;box-shadow:var(--card-shadow-hover);padding:8px;z-index:130">
          <a href="/dashboard" class="btn btn-ghost btn-sm" style="display:flex;width:100%;justify-content:flex-start">${t('myAccount')}</a>
          <a href="/settings" class="btn btn-ghost btn-sm" style="display:flex;width:100%;justify-content:flex-start">${t('settings')}</a>
          <button onclick="logout()" class="btn btn-ghost btn-sm" style="display:flex;width:100%;justify-content:flex-start;color:#b42318;border-color:rgba(180,35,24,0.22);background:rgba(180,35,24,0.08)">${t('logout')}</button>
        </div>
      </details>
      ${user.role === 'admin' ? `<a href="/admin" class="btn btn-ghost btn-sm">${t('admin')}</a>` : ''}
    `;
  } else {
    navRight.innerHTML = `
      ${langSelect}
      ${themeBtn}
      <a href="/auth" class="btn btn-ghost btn-sm">${t('login')}</a>
      <a href="/auth?mode=register" class="btn btn-primary btn-sm">${t('signup')}</a>
    `;
  }
  applyTranslations();
  renderGlobalFooter();
  updateThemeIcon();

  if (user) {
    loadNotifications().then((items) => {
      const menu = document.getElementById('notifMenu');
      if (!menu) return;
      if (!items.length) {
        menu.textContent = t('noNotifications');
        return;
      }
      menu.innerHTML = items.map((item) => `
        <div style="padding:8px 6px;border-bottom:1px solid var(--border-light)">
          <div style="font-size:.86rem;color:var(--text-primary)">${formatNotification(item)}</div>
          <div style="font-size:.72rem;color:var(--text-muted)">${new Date(item.created_at).toLocaleString()}</div>
        </div>
      `).join('');
    });
  }

}

function logout() {
  clearAuth();
  toast('Logged out successfully', 'success');
  setTimeout(() => location.href = '/', 800);
}

/* ── Art placeholder SVG ── */
function artSVG(seed, w = 400, h = 300) {
  const colors = [
    ['#e0e7ff', '#c7d2fe'],
    ['#dbeafe', '#bfdbfe'],
    ['#e0f2fe', '#bae6fd'],
    ['#ecfdf5', '#d1fae5'],
    ['#fef3c7', '#fde68a']
  ];
  const p = colors[seed % colors.length];
  const accent = ['#3b82f6', '#6366f1', '#8b5cf6', '#06b6d4', '#10b981'][seed % 5];
  
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block;background:var(--bg-tertiary)">
    <defs>
      <linearGradient id="g${seed}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p[0]}"/>
        <stop offset="100%" stop-color="${p[1]}"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#g${seed})"/>
    <circle cx="${w * 0.3}" cy="${h * 0.4}" r="${Math.min(w, h) * 0.15}" fill="${accent}" opacity="0.3"/>
    <circle cx="${w * 0.7}" cy="${h * 0.6}" r="${Math.min(w, h) * 0.1}" fill="${accent}" opacity="0.2"/>
    <rect x="${w * 0.45}" y="${h * 0.35}" width="${w * 0.1}" height="${h * 0.3}" fill="${accent}" opacity="0.15" rx="4"/>
  </svg>`;
}

/* ── Intersection reveal ── */
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { 
        e.target.style.opacity = '1'; 
        e.target.style.transform = 'translateY(0)'; 
      }
    });
  }, { threshold: 0.08 });
  
  document.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.cssText += `opacity:0;transform:translateY(20px);transition:opacity 0.5s ${i * 0.05}s ease,transform 0.5s ${i * 0.05}s ease;`;
    obs.observe(el);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadI18nDictionaries().finally(() => {
    applyTranslations();
    renderGlobalFooter();
    initTheme();
    initNavScroll();
    updateNavAuth();
    initReveal();
  });
});
