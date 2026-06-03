import type { Lang } from './types';

// Translation catalog. Keys are dotted by domain. Templates use `{name}`
// placeholders, replaced by I18nService.t().
//
// When a key isn't translated for a given language, we fall back to the
// Russian copy (then to the bare key) — never crash.

const ru = {
    'auth.invalidCredentials': 'Неверный email или пароль',
    'auth.emailExists': 'Пользователь с таким email уже существует',
    'auth.userNotFound': 'Пользователь не найден',
    'auth.passwordTooShort': 'Пароль слишком короткий',
    'auth.passwordMismatch': 'Старый пароль введён неверно',
    'auth.tokenInvalid': 'Ссылка недействительна или истекла',
    'auth.unauthorized': 'Требуется авторизация',

    'wallet.insufficient':
        'Недостаточно средств. Требуется {amount} ₸ (аренда {rental} ₸ + депозит {deposit} ₸)',
    'wallet.insufficientSimple': 'Недостаточно средств. Требуется {amount} ₸',
    'wallet.promoteCooldown': 'Это объявление недавно было продвинуто — подождите немного',
    'wallet.amountInvalid': 'Сумма должна быть от 1 до 50 000 ₸',
    'wallet.dailyLimit':
        'Превышен дневной лимит пополнения 100 000 ₸ (использовано {used} ₸)',
    'wallet.alreadyPaid': 'Заявка уже оплачена',
    'wallet.notApproved': 'Оплата доступна только для одобренных заявок',
    'wallet.expiredDates': 'Нельзя оплатить аренду с истёкшими датами',
    'wallet.requestNotFound': 'Заявка не найдена',
    'wallet.depositInsufficient': 'Недостаточно средств на депозитном счёте',

    'rental.listingNotFound': 'Объявление не найдено',
    'rental.requestNotFound': 'Заявка не найдена',
    'rental.ownerSelfRent': 'Нельзя арендовать своё объявление',
    'rental.datesOverlap': 'На эти даты уже есть аренда',
    'rental.datesPast': 'Даты в прошлом',
    'rental.datesInverted': 'Дата окончания должна быть после даты начала',
    'rental.blockedByOwner':
        'Этот пользователь вас заблокировал или вы заблокировали его',
    'rental.statusInvalid': 'Недопустимый переход статуса',
    'rental.notRenter': 'Нет доступа к этой заявке',
    'rental.notOwner': 'Нет доступа',
    'rental.returnPhotosRequired':
        'Сначала арендатор должен загрузить фото возврата',

    'dispute.alreadyOpen': 'Спор уже открыт',
    'dispute.rentalNotPaid':
        'Спор можно открыть только по оплаченной аренде',
    'dispute.rentalCompleted':
        'Аренда уже завершена — спор больше не открыть',
    'dispute.rentalNotActive': 'Спор доступен только для активных аренд',
    'dispute.notParticipant': 'Вы не участник этой аренды',
    'dispute.invalidEvidence': 'Недопустимые URL доказательств',
    'dispute.alreadyClosed': 'Спор уже закрыт',
    'dispute.splitMissing':
        'Для частичного решения нужно указать сумму возврата арендатору',
    'dispute.splitOutOfRange': 'Сумма должна быть от 0 до {max}',

    'listing.notFound': 'Объявление не найдено',
    'listing.noAccess': 'Нет доступа',
    'listing.cantRentOwn': 'Нельзя арендовать своё объявление',

    'users.cantBlockSelf': 'Нельзя заблокировать самого себя',
    'users.alreadyBlocked': 'Уже заблокирован',
    'users.blockNotFound': 'Блокировка не найдена',

    'review.alreadyLeft': 'Вы уже оставили отзыв',
    'review.rentalNotCompleted':
        'Можно оставить отзыв только после завершения аренды',
    'review.rentalNotPaid':
        'Можно оставить отзыв только после оплаченной аренды',

    'common.forbidden': 'Нет доступа',
    'common.notFound': 'Не найдено',
    'common.invalidRequest': 'Неверный запрос',
} as const;

type Key = keyof typeof ru;

const kk: Partial<Record<Key, string>> = {
    'auth.invalidCredentials': 'Email немесе құпиясөз қате',
    'auth.emailExists': 'Бұл email-мен пайдаланушы бар',
    'auth.userNotFound': 'Пайдаланушы табылмады',
    'auth.passwordTooShort': 'Құпиясөз тым қысқа',
    'auth.passwordMismatch': 'Ескі құпиясөз қате',
    'auth.tokenInvalid': 'Сілтеме жарамсыз немесе мерзімі біткен',
    'auth.unauthorized': 'Авторизация қажет',

    'wallet.insufficient':
        'Қаражат жеткіліксіз. {amount} ₸ қажет (жалдау {rental} ₸ + кепілдік {deposit} ₸)',
    'wallet.insufficientSimple': 'Қаражат жеткіліксіз. {amount} ₸ қажет',
    'wallet.promoteCooldown': 'Бұл хабарландыру жақында көтерілді — біраз күтіңіз',
    'wallet.amountInvalid': 'Сома 1-ден 50 000 ₸ дейін болуы керек',
    'wallet.dailyLimit':
        '100 000 ₸ күндік лимиттен асып кеттіңіз ({used} ₸ пайдаланылды)',
    'wallet.alreadyPaid': 'Өтінім төленді',
    'wallet.notApproved': 'Төлем тек мақұлданған өтінімдерге қолжетімді',
    'wallet.expiredDates': 'Мерзімі біткен жалдауды төлеу мүмкін емес',
    'wallet.requestNotFound': 'Өтінім табылмады',
    'wallet.depositInsufficient': 'Кепілдік шотында қаражат жетпейді',

    'rental.listingNotFound': 'Хабарландыру табылмады',
    'rental.requestNotFound': 'Өтінім табылмады',
    'rental.ownerSelfRent': 'Өз хабарландыруыңызды жалға ала алмайсыз',
    'rental.datesOverlap': 'Бұл күндерге басқа жалдау бар',
    'rental.datesPast': 'Күндер өткен шақта',
    'rental.datesInverted': 'Аяқтау күні басталу күнінен кейін болуы керек',
    'rental.blockedByOwner':
        'Бұл пайдаланушы сізді бұғаттаған немесе сіз оны бұғаттадыңыз',
    'rental.statusInvalid': 'Жарамсыз күй ауысуы',
    'rental.notRenter': 'Бұл өтінімге қол жетімсіз',
    'rental.notOwner': 'Қол жетімсіз',
    'rental.returnPhotosRequired':
        'Жалдаушы алдымен қайтару фотосын жүктеуі керек',

    'dispute.alreadyOpen': 'Дау бұрыннан ашылған',
    'dispute.rentalNotPaid': 'Дауды тек төленген жалдау үшін ашуға болады',
    'dispute.rentalCompleted': 'Жалдау аяқталды — енді дау ашуға болмайды',
    'dispute.rentalNotActive':
        'Дау тек белсенді жалдаулар үшін қолжетімді',
    'dispute.notParticipant': 'Сіз бұл жалдаудың қатысушысы емессіз',
    'dispute.invalidEvidence': 'Дәлелдер URL-і жарамсыз',
    'dispute.alreadyClosed': 'Дау жабылды',
    'dispute.splitMissing':
        'Жартылай шешім үшін жалдаушыға қайтару сомасын көрсетіңіз',
    'dispute.splitOutOfRange': 'Сома 0-ден {max} дейін болуы керек',

    'listing.notFound': 'Хабарландыру табылмады',
    'listing.noAccess': 'Қол жетімсіз',
    'listing.cantRentOwn': 'Өз хабарландыруыңызды жалға ала алмайсыз',

    'users.cantBlockSelf': 'Өзіңізді бұғаттай алмайсыз',
    'users.alreadyBlocked': 'Бұрыннан бұғатталған',
    'users.blockNotFound': 'Бұғаттау табылмады',

    'review.alreadyLeft': 'Сіз пікір қалдырғансыз',
    'review.rentalNotCompleted':
        'Пікірді жалдау аяқталғаннан кейін ғана қалдыруға болады',
    'review.rentalNotPaid':
        'Пікірді тек төленген жалдау үшін қалдыруға болады',

    'common.forbidden': 'Қол жетімсіз',
    'common.notFound': 'Табылмады',
    'common.invalidRequest': 'Жарамсыз сұраныс',
};

const en: Partial<Record<Key, string>> = {
    'auth.invalidCredentials': 'Invalid email or password',
    'auth.emailExists': 'A user with this email already exists',
    'auth.userNotFound': 'User not found',
    'auth.passwordTooShort': 'Password is too short',
    'auth.passwordMismatch': 'The current password is incorrect',
    'auth.tokenInvalid': 'The link is invalid or has expired',
    'auth.unauthorized': 'Authentication required',

    'wallet.insufficient':
        'Insufficient funds. Required {amount} ₸ (rental {rental} ₸ + deposit {deposit} ₸)',
    'wallet.insufficientSimple': 'Insufficient funds. Required {amount} ₸',
    'wallet.promoteCooldown': 'This listing was just promoted — wait a moment',
    'wallet.amountInvalid': 'Amount must be between 1 and 50,000 ₸',
    'wallet.dailyLimit':
        'Daily top-up limit of 100,000 ₸ exceeded ({used} ₸ already used)',
    'wallet.alreadyPaid': 'The request is already paid',
    'wallet.notApproved': 'Payment is only available for approved requests',
    'wallet.expiredDates': 'Cannot pay for a rental with past dates',
    'wallet.requestNotFound': 'Request not found',
    'wallet.depositInsufficient': 'Not enough funds on the deposit account',

    'rental.listingNotFound': 'Listing not found',
    'rental.requestNotFound': 'Request not found',
    'rental.ownerSelfRent': "You can't rent your own listing",
    'rental.datesOverlap': 'These dates are already booked',
    'rental.datesPast': 'Dates are in the past',
    'rental.datesInverted': 'End date must be after the start date',
    'rental.blockedByOwner': 'This user has blocked you or you have blocked them',
    'rental.statusInvalid': 'Invalid status transition',
    'rental.notRenter': "You don't have access to this request",
    'rental.notOwner': 'Access denied',
    'rental.returnPhotosRequired':
        'The renter must upload return photos first',

    'dispute.alreadyOpen': 'A dispute is already open',
    'dispute.rentalNotPaid': 'A dispute can only be opened on a paid rental',
    'dispute.rentalCompleted':
        'The rental is already completed — disputes are no longer accepted',
    'dispute.rentalNotActive': 'Disputes are only available for active rentals',
    'dispute.notParticipant': 'You are not part of this rental',
    'dispute.invalidEvidence': 'Evidence URLs are invalid',
    'dispute.alreadyClosed': 'The dispute is already closed',
    'dispute.splitMissing':
        'For a split decision you must specify the refund amount',
    'dispute.splitOutOfRange': 'Amount must be between 0 and {max}',

    'listing.notFound': 'Listing not found',
    'listing.noAccess': 'Access denied',
    'listing.cantRentOwn': "You can't rent your own listing",

    'users.cantBlockSelf': "You can't block yourself",
    'users.alreadyBlocked': 'Already blocked',
    'users.blockNotFound': 'Block not found',

    'review.alreadyLeft': "You've already left a review",
    'review.rentalNotCompleted':
        'A review can be left only after the rental is completed',
    'review.rentalNotPaid':
        'A review can be left only on a paid rental',

    'common.forbidden': 'Access denied',
    'common.notFound': 'Not found',
    'common.invalidRequest': 'Invalid request',
};

export const MESSAGES: Record<Lang, Partial<Record<Key, string>>> = {
    ru,
    kk,
    en,
};

export type MessageKey = Key;
