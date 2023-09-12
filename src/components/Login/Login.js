import React, { useState, useCallback, useEffect } from "react";
import * as yup from "yup";
import users from "../../assets/userCreds";
import { TextField } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const Login = (props) => {
  const [loginState, setLoginState] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [errObj, setErrObj] = useState({});
  let auth = JSON.parse(localStorage.getItem("user"));
  let navigate = useNavigate();

  useEffect(() => {
    if (auth && Object.keys(auth).length !== 0) {
      navigate("/");
    }
  });

  const handleChange = (e, input) => {
    setLoginState({ ...loginState, [input]: e.target.value });
  };

  const formSchema = yup.object().shape({
    email: yup
      .string()
      .email("invalid email address")
      .required("email can't be empty"),
    password: yup.string().required("password can't be empty"),
  });

  const validateUser = () => {
    let user = users.filter((x) => x.email === loginState.email);
    // // console.log("user", user);
    // if (user.length && user[0]?.password === loginState.password) {
    //   localStorage.setItem(
    //     "user",
    //     JSON.stringify({ username: user[0].username, email: user[0].email })
    //   );
    //   navigate("/");
    // } else {
    //   setMessage("Invalid email id or password! ");
    // }

    axios.post('http://localhost:3001/login', {username: loginState.email, password: loginState.password}).then(res => {
      if (res.status == 200 && res.data){
            localStorage.setItem(
        "user",
        JSON.stringify(res.data)
      );
      navigate("/");
    } else {
      setMessage("Invalid email id or password! ");
    }
    }).catch(err => {toast.error('server timed out')})

  };

  // Create handler for form submit event:
  const onSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      // Check the schema if form is valid:
      const isFormValid = await formSchema.isValid(loginState, {
        abortEarly: false, // Prevent aborting validation after first error
      });

      if (isFormValid) {
        // If form is valid, continue submission.
        // // console.log("Form is legit");
        setErrObj({});
        validateUser();
      } else {
        // If form is not valid, check which fields are incorrect:
        formSchema.validate(loginState, { abortEarly: false }).catch((err) => {
          // Collect all errors in { fieldName: boolean } format:
          const errors = err.inner.reduce((acc, error) => {
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
    [loginState]
  );

  return (
    <div className="Auth-form-container">
      <form className="Auth-form">
        <div className="Auth-form-content">
          <h3 className="Auth-form-title">Sign In</h3>
          <div className="form-group mt-3">
            <label>Email address</label>
            <TextField
              type="email"
              className="form-control mt-1"
              placeholder="Enter email"
              onChange={(e) => handleChange(e, "email")}
              autoComplete="off"
              helperText={errObj?.email !== undefined ? errObj.email : ""}
              error={errObj?.email !== undefined}
            />
          </div>
          <div className="form-group mt-3">
            <label>Password</label>
            <TextField
              type="password"
              className="form-control mt-1"
              placeholder="Enter password"
              onChange={(e) => handleChange(e, "password")}
              helperText={errObj?.password !== undefined ? errObj.password : ""}
              error={errObj?.password !== undefined}
            />
          </div>
          <div className="d-grid gap-2 mt-3">
            <button
              type="submit"
              className="btn btn-primary"
              onClick={onSubmit}
            >
              Submit
            </button>
          </div>
          {/* <p className="forgot-password text-right mt-2">
            Forgot <a href="#">password?</a>
          </p> */}
          <p className="text-right mt-3 error-msg">{message}</p>
        </div>
      </form>
    </div>
  );
};

export default Login;
