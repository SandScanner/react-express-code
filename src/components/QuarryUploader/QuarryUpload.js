import { Button } from 'react-bootstrap';
import React from 'react'
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import axios from 'axios';
import Loader from "../../utils/loader/Loader";
import { toast } from "react-toastify";
import regTemplate from './regTemplate.xlsx'

const QuarryUpload = () => {

  const [excelFile, setExcelFile] = useState(null)
  const [excelData, setExcelData] = useState(null)
  const [typeError, setTypeError] = useState(null);
  const quarryDetails = useLocation()?.state;
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  console.log("uirlll", process.env.REACT_APP_API_URL)

  //file upload
  const fileUpload = (event) => {
    setIsLoading(true);
    let selectedFile = event.target.files[0];              
    let fileTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.spreadsheetml.template'
    ,'text/csv']

    if(selectedFile){
        if(fileTypes.includes(selectedFile.type)){
            let reader = new FileReader();
            reader.readAsArrayBuffer(selectedFile);
            reader.onload = e => {
                setExcelFile(e.target.result);
            }
            setTypeError("");
            toast.success('file loaded successfully!, click load to see data');
        }else{
            setTypeError("please select only excel file types!")
        }
    }else{
        console.log('Please select your file!')
    }
    setIsLoading(false);
    }

  //file submit
  const handleFileSubmit = (event) => {
    setIsLoading(true);
    if(excelFile !== null){
        const workbook = XLSX.read(excelFile, {type: 'buffer'});
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        setExcelData(data);
        console.log("data ", data)
    }
    setIsLoading(false);
  }

  const bulkupload = () => {
    console.log("excel data", excelData);
    axios.post(process.env.REACT_APP_API_URL+'/bulkuploadQuarryList', {quarrys : excelData}).then(res => {}).catch(err => {})
  }

  const registerVehicles = async(e) => {
    setIsLoading(true);
    e.preventDefault();
    handleFileSubmit('e');

    let check = true;

    excelData.map(x => {
        if(! Object.values(x).every((v) => v != null)){
            check = false;
        }
    })

    if(check){
        await axios.post(process.env.REACT_APP_API_URL+'/vehicleRegistration', {vehicleData: excelData, quarryId: quarryDetails.quarryId}).then(res => {
            toast.success('file uploaded successfully');
            navigate('/');
        })
        .catch(err => {setIsLoading(false); toast.error('uploading to server failed!')});
    }else{
        toast.error('Excel file missing some data...')
        return;
    }
    

    // setExcelData(null);
    // setExcelFile(null);
    // setIsLoading(false);

  }

  console.log("quarry details ", quarryDetails)

  return (
        isLoading ? <Loader /> : (
            <div className='container mt-5'>
            <h1 className='text-success'>Quarry - <span className='text-primary bg-dark'>{quarryDetails?.name}</span></h1>
            <div className='container mt-4' >
            <a href={regTemplate} className='btn btn-primary'>Download Template</a>
            <form className='form-group' onSubmit={registerVehicles}>
            <input type='file' onChange={fileUpload} required/>
            <Button type='submit'>Upload</Button>
    
            {
                typeError && <div className='alert alert-danger' role='alert'>
                    {typeError}
                </div>
            }
    
            </form>
    
            
            {
                excelFile && <Button onClick={e => handleFileSubmit(e)}>Load Data</Button>
            }
            </div>
            
            
    
            <div className='viewer'>
                {excelData?(
                    <div className='table-responsive'>
                        <table className='table'>
                            <thead>
                                <tr>
                                    {
                                        Object.keys(excelData[0]).map(key => (
                                            <th key={key}>{key}</th>
                                        ))
                                    }
                                </tr>
                            </thead>
                            <tbody>
                                {excelData.map((row, index) => (
                                    <tr key={index}> 
                                        {Object.keys(row).map((key) => (
                                            <td key={key}>{row[key]}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ):(
                    <div>No file is uploaded yet!</div>
                )}
            </div>
    
            {/* <Button onClick={e => {e.preventDefault(); bulkupload()}}>
                    Bulk Upload
            </Button> */}
    
        </div>
        )
  )
}

export default QuarryUpload