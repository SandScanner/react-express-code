
const express = require('express');
const app = express();

const cors = require('cors');
const sqlite = require('sqlite3').verbose();
const mysql = require('mysql');
require('dotenv').config()
var publicDir = require('path').join(__dirname,'/public'); 
app.use(express.static(publicDir)); 
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const {create, generatePdf} = require('./pdf_convert_helper.js')
const QRLogo = require('qr-with-logo');
let db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    connectTimeout: 30000
})

app.use(cors());
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
})
app.use(express.json({limit: '10mb'}));


app.post('/login', (req, res) => {
    const {username, password} = req.body;

    let query = `select userId, username, role, quarryId, (SELECT NAME FROM quarry_list WHERE quarryId=credentials.quarryId) AS quarryName from credentials where username=? and password=?`;
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


app.post('/generate-pdf', async (req, res) => {

    let { gstin, permitNumber, vehicleData, vehicleNumber, deliveryAddress, price, gst_price,formatted_dob,formatted_approved_date, qr_url } =  req.body;

        let img_src = "";

        await QRLogo.generateQRWithLogo(qr_url, "./public/images/th_4.png", {}, "Base64", "qrlogo.png", async(base64) => {
                img_src =  'data:image/png;base64,' + base64;
                if(img_src){
                    const  html = `
                    <!doctype html>
                    <html lang="en">
                    <head>
                        <title>Permit Slip - PWD</title>
                        <meta charset="utf-8">
                        <meta content="IE=edge,chrome=1" http-equiv="X-UA-Compatible">
                        <link rel="preconnect" href="https://fonts.googleapis.com">
                        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                        <style type="text/css">
                            body {
                                font-family: 'Noto Sans Tamil', sans-serif;
                                margin:0 auto;
                                background: #fff;
                                width: 204px;
                                font-size: 8.7px;
                                
                                line-height: 1.4;
                              //   font-weight: 10;
                            }
                            td {
                                padding: 3px 5px;
                            }
                            .tbPara {
                                border-bottom: 0.5px solid #000;
                            }
                            .expand {
                              transform: scale(1, 1.16);
                              padding-top: 1.2px;
                            }
                            .expand_title {
                            //   transform: scale(1, 1.1);
                            }
                            .pageTitle {
                                text-align: center;
                                text-transform: uppercase;
                                font-size: 8.5px;
                                font-weight: 700;
                                margin-bottom: 5px;
                            }
                            .img-margin{
                            //   margin-top: 8px;
                              margin-right: 10px;
                            }
                            p {
                                margin-top: 0;
                                margin-bottom: 5px;
                            }
                            .clear {
                                overflow: hidden;
                                clear:both;
                                margin-bottom: 0px;
                            }
                            .left {
                                float: left;
                            }
                            .right {
                                float: right;
                            }
                            .center {
                                text-align: center;
                                padding: 10px;
                            }
                            .center img {
                                margin-bottom: 10px;
                            }
                    
                            .width60 {
                              width: 90%;
                              }
                            .width75 {
                                width: 75%;
                            }
                            .width100 {
                                width: 100%;
                            }
                            .width25 {
                                width: 25%;
                                text-align: right;
                            }
                            .font13 {
                                font-size: 7px;
                                font-weight: bold;
                            }
                            .text-center {
                                text-align: center;
                            }
                            .rowWiseData > div {
                                padding-top: 5px;
                            }
                            
                        </style>
                    </head>
                    <body>
                    <div class="clear">
                        <div class="width100 left expand_title">
                            <h4 class="pageTitle">கனிமம் மற்றும் கண்காணிப்பு வட்டம், சென்னை, நீ.ஆ.து நீர்வளத்துறையினால் மணல் கொண்டு செல்வதற்கு வழங்கப்பட்ட<br> அனுமதி சீட்டு முதல்படி
                                <br><strong>GSTIN: ${gstin}</strong></h4>
                        </div>
                    
                        <div class="width100 center ">
                            <img src=${img_src} width="110" height="120" class="img-margin"/>
                            <p class="font13"></p>
                        </div>
                        <p style="text-align: right; padding-right: 12px; margin-top:7px" class="expand">அனுமதி எண். <strong>${permitNumber?.entryNo}</strong></p>
                    
                        <div class="clear expand">
                            <div class="left"><p>பதிவு எண். <strong>${permitNumber?.permitNo}</strong></p></div>
                            <div class="right" style="padding-right: 10px"><p>நாள் : <strong>${formatted_dob}</strong></p></div>
                        </div>
                    </div>
                    <!-- <div class="center">
                    
                    </div> -->
                    <div class="rowWiseData width60">
                        <div class="expand">1. <strong>${vehicleData?.surveyNumber}</strong></div>
                        <div class="expand">2. <strong>${vehicleData?.VillageName}</strong></div>
                        <div class="expand">3. அலகு - <strong>${vehicleData?.unit == 3 ? '8.49 m³' : '5.66 m³'}</strong></div>
                        <div class="expand">4. (i) அனுமதி வழங்கப்பட்ட நாளும் நேரமும் <br>
                            <strong>${formatted_approved_date}</strong>
                        </div>
                        <div class="expand">(ii) செலுத்தப்பட்ட தொகை<br>
                            <strong>₹ ${price} <br>(Inclusive of CGST Rs.${gst_price}/- and SGST
                                Rs.${gst_price}/-)</strong></div>
                        <div class="expand">5. (i) மணல் கொண்டு செல்வதற்கான அனுமதி எண் / நாள்
                            <br><strong>${permitNumber?.entryNo}/ ${formatted_dob}</strong></div>
                        <div class="expand">(ii) வண்டி எண் <br><strong>${vehicleNumber}</strong></div>
                        <div class="expand">(iii) மணல் கொண்டு செல்லுமிடம் <br><strong>${deliveryAddress}</strong></div>
                        <div class="expand">6. அனுமதிதாரர் / உரிமை முகவரின் பெயரும் கையொப்பமும்<br><strong>${vehicleData?.customerName}</strong>
                        </div>
                    
                        <div class="expand">7. இந்த அனுமதியின் செல்திறன் கால அளவு <br>
                            <strong>${vehicleData?.permitExpiryDate1}</strong></div>
                    
                        <!-- <div>8. அலுவலக முத்திரை <img src=${stamp_string} width="30" /></div> -->
                    
                    </div>
                    <table style="width: 100%;">
                        <tr>
                            <td width="8%">8.</td>
                            <td width="50%" class="expand">அலுவலக முத்திரை</td>
                            <td width="2%">:</td>
                            <td width="50%">
                            <img src=${stamp_string} width="30"/>
                            </td>
                        </tr>
                        <tr>
                            <td width="8%"></td>
                            <td width="50%"><h4 style="margin: 0;" class="expand"><strong>ஓட்டுனரின் கையொப்பம்</strong></h4></td>
                            <td width="2%"></td>
                            <td width="50%"><h4 style="margin: 0;" class="expand"><strong>உதவி பொறியாளர்</strong></h4></td>
                        </tr>
                    </table>
                    <br><br><br><br>
                    </body>
                    </html>

  `;

                    sendPdfResult(req, res, html)
                }
                
        })
    

      console.log(img_src);


      const stamp_string = 'data:image/png;base64,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/GMzLdsAADvsaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/Pgo8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjUtYzAyMSA3OS4xNTU3NzIsIDIwMTQvMDEvMTMtMTk6NDQ6MDAgICAgICAgICI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgICAgICAgICAgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iCiAgICAgICAgICAgIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgICAgICAgICAgIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIKICAgICAgICAgICAgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgICAgICAgICAgeG1sbnM6ZXhpZj0iaHR0cDovL25zLmFkb2JlLmNvbS9leGlmLzEuMC8iPgogICAgICAgICA8eG1wOkNyZWF0b3JUb29sPkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChXaW5kb3dzKTwveG1wOkNyZWF0b3JUb29sPgogICAgICAgICA8eG1wOkNyZWF0ZURhdGU+MjAxNy0wNy0wNVQxNzoyMzozMSswNTozMDwveG1wOkNyZWF0ZURhdGU+CiAgICAgICAgIDx4bXA6TWV0YWRhdGFEYXRlPjIwMTctMDctMDZUMTA6MzQ6MjQrMDU6MzA8L3htcDpNZXRhZGF0YURhdGU+CiAgICAgICAgIDx4bXA6TW9kaWZ5RGF0ZT4yMDE3LTA3LTA2VDEwOjM0OjI0KzA1OjMwPC94bXA6TW9kaWZ5RGF0ZT4KICAgICAgICAgPHhtcE1NOkluc3RhbmNlSUQ+eG1wLmlpZDo0YmQ5MDE2Ni1hMTRlLTJlNDUtOWU2Zi0yMzc5YjhlNjg5ZmM8L3htcE1NOkluc3RhbmNlSUQ+CiAgICAgICAgIDx4bXBNTTpEb2N1bWVudElEPmFkb2JlOmRvY2lkOnBob3Rvc2hvcDo3ODNlNGM0Ni02MTc4LTExZTctYWRjMy04YzA1MWE0M2MzYjA8L3htcE1NOkRvY3VtZW50SUQ+CiAgICAgICAgIDx4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ+eG1wLmRpZDo3Yjc3MmE2MC1hOTdiLTUyNGYtOWI2Ni04NGQxMzA2ZDY2YWY8L3htcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD4KICAgICAgICAgPHhtcE1NOkhpc3Rvcnk+CiAgICAgICAgICAgIDxyZGY6U2VxPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5jcmVhdGVkPC9zdEV2dDphY3Rpb24+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDppbnN0YW5jZUlEPnhtcC5paWQ6N2I3NzJhNjAtYTk3Yi01MjRmLTliNjYtODRkMTMwNmQ2NmFmPC9zdEV2dDppbnN0YW5jZUlEPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6d2hlbj4yMDE3LTA3LTA1VDE3OjIzOjMxKzA1OjMwPC9zdEV2dDp3aGVuPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6c29mdHdhcmVBZ2VudD5BZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoV2luZG93cyk8L3N0RXZ0OnNvZnR3YXJlQWdlbnQ+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5zYXZlZDwvc3RFdnQ6YWN0aW9uPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6aW5zdGFuY2VJRD54bXAuaWlkOmQxMjRjYmZhLTUzMDMtMDg0ZS1iNjJiLThkZWY3NWNkYzhiNzwvc3RFdnQ6aW5zdGFuY2VJRD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OndoZW4+MjAxNy0wNy0wNVQxNzoyMzozMSswNTozMDwvc3RFdnQ6d2hlbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUGhvdG9zaG9wIENDIDIwMTQgKFdpbmRvd3MpPC9zdEV2dDpzb2Z0d2FyZUFnZW50PgogICAgICAgICAgICAgICAgICA8c3RFdnQ6Y2hhbmdlZD4vPC9zdEV2dDpjaGFuZ2VkPgogICAgICAgICAgICAgICA8L3JkZjpsaT4KICAgICAgICAgICAgICAgPHJkZjpsaSByZGY6cGFyc2VUeXBlPSJSZXNvdXJjZSI+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDphY3Rpb24+c2F2ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0Omluc3RhbmNlSUQ+eG1wLmlpZDo0YmQ5MDE2Ni1hMTRlLTJlNDUtOWU2Zi0yMzc5YjhlNjg5ZmM8L3N0RXZ0Omluc3RhbmNlSUQ+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDp3aGVuPjIwMTctMDctMDZUMTA6MzQ6MjQrMDU6MzA8L3N0RXZ0OndoZW4+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpzb2Z0d2FyZUFnZW50PkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChXaW5kb3dzKTwvc3RFdnQ6c29mdHdhcmVBZ2VudD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmNoYW5nZWQ+Lzwvc3RFdnQ6Y2hhbmdlZD4KICAgICAgICAgICAgICAgPC9yZGY6bGk+CiAgICAgICAgICAgIDwvcmRmOlNlcT4KICAgICAgICAgPC94bXBNTTpIaXN0b3J5PgogICAgICAgICA8ZGM6Zm9ybWF0PmltYWdlL3BuZzwvZGM6Zm9ybWF0PgogICAgICAgICA8cGhvdG9zaG9wOkNvbG9yTW9kZT4zPC9waG90b3Nob3A6Q29sb3JNb2RlPgogICAgICAgICA8cGhvdG9zaG9wOklDQ1Byb2ZpbGU+c1JHQiBJRUM2MTk2Ni0yLjE8L3Bob3Rvc2hvcDpJQ0NQcm9maWxlPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICAgICA8dGlmZjpYUmVzb2x1dGlvbj43MjAwMDAvMTAwMDA8L3RpZmY6WFJlc29sdXRpb24+CiAgICAgICAgIDx0aWZmOllSZXNvbHV0aW9uPjcyMDAwMC8xMDAwMDwvdGlmZjpZUmVzb2x1dGlvbj4KICAgICAgICAgPHRpZmY6UmVzb2x1dGlvblVuaXQ+MjwvdGlmZjpSZXNvbHV0aW9uVW5pdD4KICAgICAgICAgPGV4aWY6Q29sb3JTcGFjZT4xPC9leGlmOkNvbG9yU3BhY2U+CiAgICAgICAgIDxleGlmOlBpeGVsWERpbWVuc2lvbj4xMDA8L2V4aWY6UGl4ZWxYRGltZW5zaW9uPgogICAgICAgICA8ZXhpZjpQaXhlbFlEaW1lbnNpb24+MTAwPC9leGlmOlBpeGVsWURpbWVuc2lvbj4KICAgICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg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'
      
});

async function sendPdfResult(req, res, html) {
    if (!html) {
        return res.status(400).send('HTML content is required.');
      }

    try {
        const pdfBuffer = await generatePdf(html);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=file.pdf');
        res.status(200).send(pdfBuffer);
      } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
      }
}

app.listen(3001, () => {console.log("Server is Running...")})
