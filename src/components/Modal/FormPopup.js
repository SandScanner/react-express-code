import React, { useCallback, useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import TextField from "@mui/material/TextField";
import { Row } from "react-bootstrap";
import * as yup from "yup";

const FormPopup = ({ show, id, closePopup, data, saveFormData }) => {
  let defaultState = {
    id: "",
    name: "",
    salary: "",
    phone: "",
    email: "",
    address: "",
  };

  const [empData, setEmpData] = useState({});
  const [errObj, setErrObj] = useState({});

  const handleChange = (e, input) => {
    setEmpData({ ...empData, [input]: e.target.value });
  };

  const handleClose = () => {
    setEmpData(defaultState);
    setErrObj({});
    closePopup();
  };

  useEffect(() => {
    if (show) {
      setEmpData(data ? data : defaultState);
    }
  }, [show]);

  const formSchema = yup.object().shape({
    name: yup.string().required("name can't be empty"),
    salary: yup
      .number()
      .required("salary can't be empty")
      .typeError("salary should be a number"),
    email: yup
      .string()
      .email("invalid email address")
      .required("email can't be empty"),
    phone: yup
      .string()
      .matches(
        /^(\+\d{1,2}\s?)?1?\-?\.?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/,
        "Phone number should be in proper format."
      )
      .required("phone can't be empty"),
    address: yup.string().required("address can't be empty"),
  });

  // Create handler for form submit event:
  const onSubmit = useCallback(
    async (event) => {
      // Check the schema if form is valid:
      const isFormValid = await formSchema.isValid(empData, {
        abortEarly: false, // Prevent aborting validation after first error
      });

      if (isFormValid) {
        // If form is valid, continue submission.
        // console.log("Form is legit");
        setErrObj({});
        saveFormData(empData, id !== undefined ? id : -1);
        handleClose();
      } else {
        // If form is not valid, check which fields are incorrect:
        formSchema.validate(empData, { abortEarly: false }).catch((err) => {
          // Collect all errors in { fieldName: boolean } format:
          const errors = err.inner.reduce((acc, error) => {
            // console.log("error", error.message, acc);
            return {
              ...acc,
              [error.path]: error.message,
            };
          }, {});

          // Update form errors state:
          setErrObj(errors);
        });
      }
    },
    [empData]
  );

  // console.log("Errors", errObj);

  return (
    <Modal
      show={show}
      onHide={() => handleClose()}
      backdrop="static"
      keyboard={false}
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title>Add Employee Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <TextField
            error={errObj?.name !== undefined}
            id="standard-error-helper-text"
            label="Employee Name"
            defaultValue={empData.name}
            value={empData.name}
            helperText={errObj?.name !== undefined ? errObj.name : ""}
            variant="standard"
            onChange={(e) => handleChange(e, "name")}
            className="col m-2"
          />
        </Row>

        <Row>
          <TextField
            error={errObj?.salary !== undefined}
            id="standard-error-helper-text"
            label="Salary"
            defaultValue={empData.salary}
            value={empData.salary}
            helperText={errObj?.salary !== undefined ? errObj.salary : ""}
            variant="standard"
            onChange={(e) => handleChange(e, "salary")}
            className="col m-2"
          />
        </Row>

        <Row>
          <TextField
            error={errObj?.phone !== undefined}
            id="standard-error-helper-text"
            label="Phone"
            defaultValue={empData.phone}
            value={empData.phone}
            helperText={errObj?.phone !== undefined ? errObj.phone : ""}
            variant="standard"
            onChange={(e) => handleChange(e, "phone")}
            className="col m-2"
          />
        </Row>

        <Row>
          <TextField
            error={errObj?.email !== undefined}
            id="standard-error-helper-text"
            label="Email"
            defaultValue={empData.email}
            value={empData.email}
            helperText={errObj?.email !== undefined ? errObj.email : ""}
            variant="standard"
            className="col m-2"
            onChange={(e) => handleChange(e, "email")}
          />
        </Row>

        <Row>
          <TextField
            error={errObj?.address !== undefined}
            id="standard-error-helper-text"
            label="Address"
            defaultValue={empData.address}
            value={empData.address}
            helperText={errObj?.address !== undefined ? errObj.address : ""}
            variant="standard"
            multiline
            rows={2}
            className="col m-2"
            onChange={(e) => handleChange(e, "address")}
          />
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
        <Button variant="primary" onClick={onSubmit}>
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default FormPopup;
