"use client";
import { Course } from "@lib/types";
import {
  Button,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import axios from "axios";
import { useEffect, useState } from "react";

export default function Home() {
  //All courses state
  const [courses, setCourses] = useState<Course[]|null>(null);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingMyCourses, setLoadingMyCourses] = useState(false);

  //login state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [authenUsername, setAuthenUsername] = useState("");

  //my courses state
  const [myCourses, setMyCourses] = useState<Course[]|null>(null);

  const loadCourses = async () => {
    setLoadingCourses(true);

    const resp = await axios.get("/api/courses");
    setCourses(resp.data.courses);

    setLoadingCourses(false);
  };

  const loadMyCourses = async () => {
    setLoadingMyCourses(true);

    const resp = await axios.get("/api/enrollments", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
  });
    //console.log(resp.data.courses);
    //setMyCourses(resp.data.courses);
    setMyCourses(resp.data.courses);
    setLoadingMyCourses(false);
  };

  // load courses when app starts the first time
  useEffect(() => {
    loadCourses();

   // read token and authen username from local storage
  const token = localStorage.getItem("token");
  const authenUsername = localStorage.getItem("username");
  if (token && authenUsername) {
    setToken(token);
    setAuthenUsername(authenUsername);
  }  
  }, []);

  // load my courses when the "token" is changed (logged in successfully)
  // also load my courses when app starts the first time
  useEffect(() => {
    if (!token) return;

    loadMyCourses();
  }, [token]);

  const login = async () => {
    try {
      const resp = await axios.post("/api/user/login", { username: username, password: password });

      // set token and authenUsername here
      setToken(resp.data.token);
      setAuthenUsername(resp.data.username);
      // clear login form
      setUsername("");
      setPassword("");

      //save token and authen username to local storage
      localStorage.setItem("token", resp.data.token);
      localStorage.setItem("username", resp.data.username);

    } catch (error) {
      if (error.response.data)
        // show error message from API response
        alert(error.response.data.message);
      else
        // show other error messages
        alert(error.message);
    }
  };

  const logout = () => {
    // set necessary state variables after logged out
    setAuthenUsername("");
    setToken("");
    setMyCourses(null);

    localStorage.removeItem("token")
    localStorage.removeItem("username")
  };

  return (
    <Container size="sm">
      <Title fs="italic" ta="center" my="xs">
        Course Enrollments
      </Title>
      <Stack>
        {/* all courses section */}
        <Paper withBorder p="md">
          <Title order={4}>All courses</Title>
          <Loader variant="dots" />
          {courses &&
            courses.map((course:Course) => (
              <Text key={course.courseNo}>
                {course.courseNo} - {course.title}
              </Text>
            ))}
        </Paper>

        {/* log in section */}
        <Paper withBorder p="md">
          <Title order={4}>Login</Title>
          
          {/* show login form if not logged in */}
          <Group align="flex-end">
            <TextInput
              label="Username"
              onChange={(e) => setUsername(e.target.value)}
              value={username}
            />
            <TextInput
              label="Password"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
            />
            <Button onClick={login}>Login</Button>
          </Group>

          {/* show log out option if logged in successfully */}
          { authenUsername &&
          <Group>
            <Text fw="bold">Hi {authenUsername}!</Text>
            <Button color="red" onClick={logout}>
              Logout
            </Button>
          </Group> }
          
        </Paper>

        {/* enrollment section */}
        <Paper withBorder p="md">
          <Title order={4}>My courses</Title>
          { !authenUsername && <Text c="dimmed">Please login to see your course(s)</Text> }

          {myCourses &&
            myCourses.map((course) => (
              <Text key={course.courseNo}>
                {course.courseNo} - {course.title}
              </Text>
            ))}
        </Paper>
      </Stack>
    </Container>
  );
}
