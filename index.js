const express =  require('express');
const path= require('path');
const sqlite3=require('sqlite3');
const {open} = require('sqlite');
const cors = require('cors');
const e = require('cors');
const app = express();
app.use(cors());
app.use(express.json())

const dbpath = path.join(__dirname,'booksstore.db');
let db = null;

const startServerandDatabase = async() => {
    try{
        db = await open({
            filename:dbpath,
            driver: sqlite3.Database,
        });
        app.listen(3000,()=>console.log('server is running at port 3000'));
    }catch(error){
        console.log(error);
        process.exit(1);
    }
}

startServerandDatabase();

async function createAuthor(authorName) {
    try {
      const existingAuthor = await db.get(
        'SELECT author_id FROM author WHERE lower(author) = ?',
        [authorName]
      );
  
      if (existingAuthor) {
        return existingAuthor;
      }
  
      await db.run('INSERT INTO author (author) VALUES (?)', [authorName]);
      const newAuthor = await db.get('SELECT author_id where author=?',[authorName]);
      return newAuthor;
    } catch (error) {
      console.error('Error creating author:', error);
      throw error;
    }
  }

app.get('/books',async(request,response)=>{
    //console.log('working')
    try{
        const query= `select * from books inner join genre on genre.genre_id=GenreID inner join author on books.authorId=author_id;`
        const data= await db.all(query);
        response.json({message:'data fetch successfully',books:data});
    }catch(error){
        console.log(error);
        response.json('Internal error occur')
    }
});

app.get('/book/:BookId',async(request,response)=>{
    const {BookId} = request.params;
    //console.log('working')
    try{
        const query= `select * from books inner join genre on genre.genre_id=GenreID inner join author on books.authorId=author_id 
        where BookId=${BookId};`
        const data= await db.get(query);
        response.json({message:'data fetch successfully',book:data});
    }catch(error){
        console.log(error);
        response.json('Internal error occur')
    }
});


app.post('/books/add', async (request, response) => {
    const { bookTitle, description, author, genre, date, pages, imageUrl } = request.body;
    //console.log(bookTitle,description,author,genre,pages,date,imageUrl)
    try {
      const authorId = await createAuthor(author);
      const authorIds=authorId.author_id
      const existingGenre = await db.get(
        'SELECT genre_id FROM genre WHERE genre = ?',
        [genre]
      );

      let genreId= existingGenre.genre_id;
      await db.run(
        'INSERT INTO books (Title, Description, AuthorID, GenreID, PublishedDate, Pages, imageUrl) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [bookTitle, description, authorIds, genreId, date, pages, imageUrl]
      );
  
      response.json({ message: 'Book added successfully!' });
    } catch (error) {
      console.error('Error adding book:', error);
      response.status(500).json({ message: 'Error adding book' });
    }
  });

  app.delete("/book/remove/:BookId",async(request,response)=>{
    const {BookId} = request.params
    try{
      await db.run(`delete from books where BookID=?`,[BookId])
      response.json({message:'Book deleted successfully'});
    }catch(error){
        console.log(error);
        response.json('Internal error occur')
    }
  });

  app.put('/books/update/:BookId',async(request,response)=>{
    const {BookId} = request.params
    const { bookTitle, description, author, genre, date, pages, imageUrl } = request.body;
    try {
      const authorId = await createAuthor(author);
      const authorIds=authorId.author_id
      const existingGenre = await db.get(
        'SELECT genre_id FROM genre WHERE genre = ?',
        [genre]
      );

      let genreId= existingGenre.genre_id;
      await db.run(
        `UPDATE books
         SET Title = ?,
             Description = ?,
             AuthorID = ?,
             GenreID = ?,
             PublishedDate = ?,
             Pages = ?,
             imageUrl = ?
         WHERE BookID = ?`,
        [bookTitle, description, authorIds, genreId, date, pages, imageUrl, BookId]
      );
  
      response.json({ message: 'Book updated successfully!' });
    } catch (error) {
      console.error('Error adding book:', error);
      response.status(500).json({ message: 'Error adding book' });
    }
  })

  /*app.get('/',async(request,response)=>{
    //console.log('working')
    try{
        const query= `select * from books;`
        const data= await db.all(query);
        response.json({message:'data fetch successfully',books:data});
    }catch(error){
        console.log(error);
        response.json('Internal error occur')
    }
});*/