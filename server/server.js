const express = require('express');
const app = express();

const cors = require('cors');
const sqlite = require('sqlite3').verbose();
const mysql = require('mysql');
require('dotenv').config()


let db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
})

app.use(cors());
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
})
app.use(express.json({limit: '10mb'}));


app.post('/login', (req, res) => {
    const {username, password} = req.body;

    let query = `select userId, username, role, quarryId from credentials where username=? and password=?`;
    let values = [username, password]

    db.query(query, values, (err, row) => {
        if(err){
            throw err;
        }
        if(row.length){
            res.send(row[0])
        }else{
            res.sendStatus(204);
        }
    })
})

app.post('/bulkuploadQuarryList', (req, res) => {
    const  {quarrys}  = req.body;
    let sqlstatement = '';
    let TABLE_NAME = 'quarry_list';
    quarrys.map(async(x) => {
        let keylist = "("
        let valuelist = "("
        let firstPair = true
        for (const [key, value] of Object.entries(x)){
        if (!firstPair){
            keylist += ", "
            valuelist += ", "
        }
        firstPair = false
        keylist += key
        if(typeof(value) == 'string')
            valuelist += "'" + value + "'"
        else
            valuelist += value
        }
        keylist += ")"
        valuelist += ")"
        sqlstatement = "INSERT INTO " + TABLE_NAME + " " + keylist + " VALUES " + valuelist + ";"
        await db.query(sqlstatement);
        
        console.log("inserted...")
    })
    

    console.log("success")
})


app.post('/vehicleRegistration', (req, res) => {
    const { vehicleData, quarryId }  = req.body;
    let sqlstatement = '';
    let TABLE_NAME = 'permitbookings';

    /* date time logic */

    let date_time = new Date().toISOString()
    

    /*********************/

    vehicleData.map(async(x) => {
        let keylist = "("
        let valuelist = "("
        let firstPair = true
        for (const [key, value] of Object.entries(x)){
        if (!firstPair){
            keylist += ", "
            valuelist += ", "
        }
        firstPair = false
        keylist += key
        if(typeof(value) == 'string')
            valuelist += "'" + value + "'"
        else
            valuelist += value
        }
        keylist += ", quarryId, orderStatus, dateOfBooking)";
        valuelist += `, ${quarryId}, 0, NOW())`;
        sqlstatement = "INSERT INTO " + TABLE_NAME + " " + keylist + " VALUES " + valuelist + ";"
        await db.query(sqlstatement);
        console.log(sqlstatement)
        console.log("success")    
    });
    
    res.send('success');
    
})

app.post('/getBookingDetails', (req, res) => {
    const {vehicleNumber, userId} = req.body;
    let query = `SELECT * FROM permitbookings a INNER JOIN quarry_list b ON a.quarryId=b.quarryId WHERE vehicleRegNumber=? AND orderStatus=0 AND (deletedAt IS null or deletedAt='')
    and a.quarryId=(select quarryId from credentials where userId=?)`;

    let values = [vehicleNumber, userId]
    console.log('vehiclenumner ', vehicleNumber, userId)
    db.query(query, values, (err, row) => {
        if(err){
            throw err;
        }
        if(row.length){
            res.send(row[0])
        }else{
            res.sendStatus(204);
        }
    })

})

app.post('/confirmAndCloseOrder', (req, res) => {
    const {permitId, userId} = req.body;
    let query = `   UPDATE permitbookings SET orderStatus=1, deletedAt=NOW() WHERE regNo=? AND orderStatus=0 AND (deletedAt IS null or deletedAt='')
    and quarryId=(select quarryId from credentials where userId=?)`
    let values = [permitId, userId]
    console.log('vehiclenumner ', permitId, userId)
    db.query(query, values, (err, row) => {
        if(err){
            throw err;
        }
        if(row){
            res.sendStatus(200);
        }
    })
})

app.get('/health', (req, res) => {
    res.sendStatus(200);
})

app.listen(3001, () => {console.log("Server is Running...")})