import React, { useState } from 'react'
import { Button, Table } from 'react-bootstrap'
import { QuarryList } from '../../assets/QuarryList'
import { useNavigate } from 'react-router-dom'

const Dashboard = () => {

  const navigate = useNavigate();
  const changePage = (data) => {
    navigate('upload', {
      state: data
    })
  }

  return (
    <div className='container mt-5'>
        <Table striped bordered hover>
  <thead>
    <tr>
      <th>#</th>
      <th>Quarry</th>
      <th>District</th>
      <th>Select</th>
    </tr>
  </thead>
  <tbody>
    {
      QuarryList.map((x, i) => (
        <tr key={i}>
        <td>{x.quarryId}</td>
        <td>{x.name}</td>
        <td>{x.district}</td>
        <td><Button key={`${i}Button`} onClick={e => changePage(x)}> Select </Button></td>
        </tr>
      ))
    }
  </tbody>
</Table>
    </div>
  )
}

export default Dashboard