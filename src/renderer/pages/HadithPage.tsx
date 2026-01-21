import React, { useState, useEffect } from 'react'
import { Search, BookOpen, Book as BookIcon, ChevronRight } from 'lucide-react'

interface Hadith {
  hadithNumber: string
  text: string
  source: string
  grade?: string
  arabicText?: string
}

interface Book {
  bookNumber: number
  book: Array<{ lang: string; name: string }>
  hadithStartNumber: number
  hadithEndNumber: number
  numberOfHadith: number
}

export const HadithPage: React.FC = () => {
  const [hadithList, setHadithList] = useState<Hadith[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCollection, setSelectedCollection] = useState('bukhari')
  const [loading, setLoading] = useState(false)
  const [selectedHadith, setSelectedHadith] = useState<Hadith | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [selectedBook, setSelectedBook] = useState<number | null>(null)
  const [showBooks, setShowBooks] = useState(false)

  const collections = [
    { id: 'bukhari', name: 'Sahih al-Bukhari', ar: 'صحيح البخاري', apiName: 'bukhari', count: '7563 hadiths, 97 books' },
    { id: 'muslim', name: 'Sahih Muslim', ar: 'صحيح مسلم', apiName: 'muslim', count: '7563 hadiths, 56 books' },
    { id: 'nasai', name: "Sunan an-Nasa'i", ar: 'سنن النسائي', apiName: 'nasai', count: '5758 hadiths, 51 books' },
    { id: 'abudawud', name: 'Sunan Abi Dawud', ar: 'سنن أبي داود', apiName: 'abudawud', count: '5274 hadiths, 43 books' },
    { id: 'tirmidhi', name: 'Jami at-Tirmidhi', ar: 'جامع الترمذي', apiName: 'tirmidhi', count: '3956 hadiths, 46 books' },
    { id: 'ibnmajah', name: 'Sunan Ibn Majah', ar: 'سنن ابن ماجه', apiName: 'ibnmajah', count: '4341 hadiths, 37 books' },
    { id: 'malik', name: 'Muwatta Malik', ar: 'موطأ مالك', apiName: 'malik', count: '1594 hadiths, 61 books' },
    { id: 'ahmad', name: 'Musnad Ahmad', ar: 'مسند أحمد', apiName: 'ahmad', count: '27000+ hadiths, 50 books' },
    { id: 'darimi', name: 'Sunan ad-Darimi', ar: 'سنن الدارمي', apiName: 'darimi', count: '3503 hadiths, 32 books' },
    { id: 'nawawi40', name: "An-Nawawi's 40 Hadith", ar: 'الأربعون النووية', apiName: 'nawawi40', count: '42 hadiths' },
    { id: 'riyadussalihin', name: 'Riyad as-Salihin', ar: 'رياض الصالحين', apiName: 'riyadussalihin', count: '1896 hadiths, 19 books' },
    { id: 'adab', name: 'Al-Adab Al-Mufrad', ar: 'الأدب المفرد', apiName: 'adab', count: '1322 hadiths, 56 books' },
    { id: 'shamail', name: "Ash-Shama'il Al-Muhammadiyah", ar: 'الشمائل المحمدية', apiName: 'shamail', count: '414 hadiths, 55 books' },
    { id: 'mishkat', name: 'Mishkat al-Masabih', ar: 'مشكاة المصابيح', apiName: 'mishkat', count: '6278 hadiths, 29 books' },
    { id: 'bulugh', name: 'Bulugh al-Maram', ar: 'بلوغ المرام', apiName: 'bulugh', count: '1358 hadiths, 16 books' },
    { id: 'qudsi40', name: '40 Hadith Qudsi', ar: 'الأربعون القدسية', apiName: 'qudsi40', count: '40 hadiths' },
    { id: 'hisn', name: 'Hisn al-Muslim', ar: 'حصن المسلم', apiName: 'hisn', count: '132 hadiths' },
  ]

  // Comprehensive mock data - realistic structure matching Sunnah.com
  const generateMockHadiths = (collectionId: string, bookNumber: number, count: number): Hadith[] => {
    const collection = collections.find(c => c.id === collectionId)
    const hadiths: Hadith[] = []
    
    const hadithTemplates = [
      'The Prophet Muhammad (ﷺ) said: "Actions are judged by intention, and every person shall have only what they intended."',
      'Verily, the most beloved deeds to Allah are those done most frequently, even if they are small.',
      'The Prophet Muhammad (ﷺ) said: "The best among you are those who have the best characters."',
      'None of you truly believes until he loves for his brother what he loves for himself.',
      'Seeking knowledge is a duty incumbent on every Muslim male and female.',
      'The strong is not the one who overcomes people with strength, but the strong is the one who controls his anger.',
      'Modesty and faith are companions. When one is lost, the other departs as well.',
      'The best charity is that given when one is in need.',
      'Whoever believes in Allah and the Last Day should speak good words or remain silent.',
      'The believer continues learning good until he enters Paradise.',
      'Do not envy one another, do not inflate prices, do not hate one another.',
      'Guard yourself against the Fire even if it is with a single date.',
      'Verily, in the body there is a piece of flesh, which if it is sound, the whole body is sound.',
      'The best of you is the one who is best to his family.',
      'Whoever is merciful to the creatures of Allah, Allah will be merciful to him.',
      'The most perfect believers are those with the best characters.',
      'Among the most complete of believers in faith are those who are most excellent in character.',
      'Whoever is gentle and kind, Allah will be gentle and kind to him.',
      'The best deed is what brings joy to a Muslim.',
      'If you commit a sin, do not persist in it. Repent to Allah sincerely.',
      'The believer\'s example is like the palm tree - it remains firm and gives continuous benefit.',
      'Treat women kindly, for they are help-mates and partners in this life.',
      'The best remedy is trust in Allah and patience in all matters.',
      'Every one of you is a guardian and is responsible for those under his care.',
      'Whoever looks after the widow and the poor is like one who fights in the path of Allah.'
    ]

    for (let i = 1; i <= count; i++) {
      const template = hadithTemplates[i % hadithTemplates.length]
      hadiths.push({
        hadithNumber: `${bookNumber}:${i}`,
        text: template,
        source: `${collection?.name} - Book ${bookNumber}, Hadith ${i}`,
        grade: i % 3 === 0 ? 'Hasan' : 'Sahih',
        arabicText: 'قَالَ رَسُولُ اللَّهِ صلى الله عليه وسلم: ...'
      })
    }
    
    return hadiths
  }

  const getMockBooks = (collectionId: string): Book[] => {
    const bookCounts: Record<string, { count: number; names: string[] }> = {
      bukhari: { 
        count: 97, 
        names: ['Revelation', 'Belief', 'Knowledge', 'Ablutions', 'Bathing', 'Menstrual Periods', 'Tayammum', 'Prayers', 'Times of Prayers', 'Call to Prayers']
      },
      muslim: { count: 56, names: ['Faith', 'Purification', 'Prayer', 'Mosques', 'Zakaat', 'Fasting', 'Hajj', 'Marriage', 'Divorce', 'Commerce'] },
      nasai: { count: 51, names: ['Purification', 'Prayer', 'Times', 'Mosques', 'Friday', 'Funerals', 'Zakaat', 'Fasting', 'Hajj', 'Jihad'] },
      abudawud: { count: 43, names: ['Purification', 'Prayer', 'Zakaat', 'Fasting', 'Hajj', 'Marriage', 'Divorce', 'Foods', 'Medicine', 'Knowledge'] },
      tirmidhi: { count: 46, names: ['Purification', 'Prayer', 'Zakaat', 'Fasting', 'Hajj', 'Marriage', 'Breastfeeding', 'Divorce', 'Commerce', 'Judgements'] },
      ibnmajah: { count: 37, names: ['Purification', 'Prayer', 'Mosques', 'Call to Prayer', 'Funerals', 'Fasting', 'Zakaat', 'Marriage', 'Divorce', 'Commerce'] },
      malik: { count: 61, names: ['Times of Prayer', 'Purification', 'Prayer', 'Forgetfulness in Prayer', 'Friday', 'Prayer in Ramadan', 'Tahajjud', 'Qibla', 'Funerals', 'Zakaat'] },
      ahmad: { count: 50, names: ['Hadith of Abdullah ibn Abbas', 'Hadith of Abdullah ibn Umar', 'Hadith of Abdullah ibn Mas\'ud', 'Hadith of Abu Huraira'] },
      darimi: { count: 32, names: ['Introduction', 'Purification', 'Prayer', 'Zakaat', 'Fasting', 'Hajj', 'Sacrifice', 'Marriage', 'Divorce', 'Commerce'] },
      nawawi40: { count: 1, names: ['The 40 Hadith'] },
      riyadussalihin: { count: 19, names: ['Sincerity', 'Repentance', 'Patience', 'Truthfulness', 'Mindfulness', 'Certainty', 'Reliance', 'Thankfulness', 'Hope', 'Fear'] },
      adab: { count: 56, names: ['Parents', 'Ties of Kinship', 'Respect', 'Greetings', 'Visiting', 'Gatherings', 'Neighbours', 'Generosity', 'Speech', 'Manners'] },
      shamail: { count: 55, names: ['Description', 'Seal', 'Hair', 'Beard', 'Face', 'Beauty', 'Stature', 'Walking', 'Sitting', 'Food'] },
      mishkat: { count: 29, names: ['Faith', 'Knowledge', 'Purification', 'Prayer', 'Zakaat', 'Fasting', 'Hajj', 'Commerce', 'Marriage', 'Divorce'] },
      bulugh: { count: 16, names: ['Purification', 'Prayer', 'Funerals', 'Zakaat', 'Fasting', 'Hajj', 'Commerce', 'Marriage', 'Crimes', 'Judgements'] },
      qudsi40: { count: 1, names: ['40 Hadith Qudsi'] },
      hisn: { count: 1, names: ['Fortress of the Muslim'] }
    }

    const config = bookCounts[collectionId] || { count: 10, names: [] }
    const books: Book[] = []

    for (let i = 1; i <= config.count; i++) {
      const bookName = config.names[i - 1] || `Book ${i}`
      books.push({
        bookNumber: i,
        book: [
          { lang: 'en', name: bookName },
          { lang: 'ar', name: `كتاب ${i}` }
        ],
        hadithStartNumber: (i - 1) * 50 + 1,
        hadithEndNumber: i * 50,
        numberOfHadith: 50
      })
    }

    return books
  }

  const fetchHadiths = async (query?: string) => {
    setLoading(true)
    try {
      let hadiths: Hadith[] = []
      
      if (selectedBook !== null) {
        hadiths = generateMockHadiths(selectedCollection, selectedBook, 50)
      } else {
        // Show hadiths from first 3 books when no book selected
        hadiths = [
          ...generateMockHadiths(selectedCollection, 1, 25),
          ...generateMockHadiths(selectedCollection, 2, 25),
          ...generateMockHadiths(selectedCollection, 3, 25)
        ]
      }
      
      // Filter by search query if provided
      if (query && query.trim()) {
        hadiths = hadiths.filter(h => 
          h.text.toLowerCase().includes(query.toLowerCase()) ||
          h.source.toLowerCase().includes(query.toLowerCase())
        )
      }
      
      setHadithList(hadiths)
    } catch (error) {
      console.error('Error loading hadiths:', error)
      setHadithList([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Load books when collection changes
    const bookList = getMockBooks(selectedCollection)
    setBooks(bookList)
    setSelectedBook(null)
    setShowBooks(false)
    fetchHadiths()
  }, [selectedCollection])

  useEffect(() => {
    // Reload hadiths when book changes
    if (selectedBook !== null) {
      fetchHadiths()
    }
  }, [selectedBook])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      fetchHadiths(searchQuery)
    }
  }

  const selectedCollectionData = collections.find(c => c.id === selectedCollection)

  return (
    <div className="h-full flex gap-6 p-6 bg-gray-50 dark:bg-gray-900 relative">
      {/* Collections Sidebar */}
      <div className="w-72 bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-lg text-islamic-primary dark:text-islamic-accent">
            📚 Collections ({collections.length})
          </h2>
        </div>
        <div className="overflow-y-auto flex-1">
          {collections.map((collection) => (
            <button
              key={collection.id}
              onClick={() => {
                setSelectedCollection(collection.id)
                setSelectedHadith(null)
              }}
              className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700 transition-colors ${
                selectedCollection === collection.id
                  ? 'bg-islamic-accent text-white'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100'
              }`}
            >
              <div className="font-semibold text-sm">{collection.name}</div>
              <div className="text-xs opacity-70 mt-0.5">{collection.ar}</div>
              <div className="text-xs opacity-60 mt-1">{collection.count}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Hadiths Display */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg text-islamic-primary dark:text-islamic-accent">
              {selectedCollectionData?.name}
            </h3>
            <button
              onClick={() => setShowBooks(!showBooks)}
              className="px-3 py-1.5 bg-islamic-accent hover:bg-islamic-primary text-white rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <BookIcon size={16} />
              {showBooks ? 'Hide' : 'Browse'} Books ({books.length})
            </button>
          </div>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Chercher un hadith..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-islamic-accent"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-islamic-accent hover:bg-islamic-primary text-white rounded-lg transition-colors"
            >
              Chercher
            </button>
          </form>
        </div>

        {/* Books Grid (if shown) */}
        {showBooks && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {books.map((book) => (
                <button
                  key={book.bookNumber}
                  onClick={() => {
                    setSelectedBook(book.bookNumber)
                    setShowBooks(false)
                  }}
                  className={`p-3 rounded-lg text-left transition-all ${
                    selectedBook === book.bookNumber
                      ? 'bg-islamic-accent text-white shadow-md'
                      : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <div className="font-semibold text-xs mb-1">Book {book.bookNumber}</div>
                  <div className="text-xs opacity-75">{book.book[0].name}</div>
                  <div className="text-xs opacity-60 mt-1">{book.numberOfHadith} hadiths</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Book Info */}
        {selectedBook !== null && (
          <div className="px-4 py-2 bg-islamic-primary text-white text-sm flex items-center justify-between">
            <span>📖 Book {selectedBook}: {books.find(b => b.bookNumber === selectedBook)?.book[0].name}</span>
            <button
              onClick={() => setSelectedBook(null)}
              className="hover:underline"
            >
              View All
            </button>
          </div>
        )}

        {/* Hadiths List or Selected Hadith */}
        {selectedHadith ? (
          <div className="overflow-y-auto flex-1 p-6">
            <button
              onClick={() => setSelectedHadith(null)}
              className="mb-4 text-islamic-accent hover:underline flex items-center gap-1"
            >
              ← Retour à la liste
            </button>
            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl">
              <div className="flex items-start gap-3 mb-4">
                <BookOpen className="text-islamic-accent flex-shrink-0 mt-1" size={24} />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-islamic-primary dark:text-islamic-accent">
                    {selectedHadith.source}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Grade: {selectedHadith.grade}</p>
                </div>
              </div>
              {selectedHadith.arabicText && (
                <div className="text-right text-2xl mb-4 text-gray-900 dark:text-gray-100 font-arabic leading-loose">
                  {selectedHadith.arabicText}
                </div>
              )}
              <p className="text-lg leading-relaxed text-gray-900 dark:text-gray-100">
                {selectedHadith.text}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-4xl mb-2">⏳</div>
                  <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
                </div>
              </div>
            ) : hadithList.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {hadithList.map((hadith, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedHadith(hadith)}
                    className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-islamic-accent text-white flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-islamic-primary dark:text-islamic-accent flex items-center gap-2">
                          {hadith.source}
                          <span className="text-xs px-2 py-0.5 rounded-full bg-islamic-accent bg-opacity-20 text-islamic-accent">
                            {hadith.grade}
                          </span>
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {hadith.text}
                        </p>
                      </div>
                      <ChevronRight className="text-gray-400 flex-shrink-0 mt-1" size={20} />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">📖</div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchQuery ? 'Aucun hadith trouvé' : 'Sélectionnez une collection ou un livre'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Development Overlay - Completely blocks interaction */}
      <div className="absolute inset-0 bg-gray-800 bg-opacity-60 backdrop-blur-sm rounded-xl flex items-center justify-center z-50 pointer-events-auto" style={{ pointerEvents: 'auto' }}>
        <div className="bg-gray-700 bg-opacity-90 p-8 rounded-lg text-center max-w-md">
          <div className="text-5xl mb-4">🔧</div>
          <h2 className="text-2xl font-bold text-white mb-2">En développement</h2>
          <p className="text-gray-200 text-sm">
            Cette catégorie n'est pas encore accessible. Nous travaillons actuellement à son intégration complète.
          </p>
          <p className="text-gray-400 text-xs mt-4">
            Revenez bientôt pour accéder aux Hadiths.
          </p>
        </div>
      </div>
    </div>
  )
}

export default HadithPage
