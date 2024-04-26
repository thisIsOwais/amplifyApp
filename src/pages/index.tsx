// index.tsx
import Amplify, { API, withSSRContext } from "aws-amplify";
import { GetServerSideProps } from "next";
import React from "react";
import styles from "../../styles/Home.module.css";
import { Todo, CreateTodoInput, CreateTodoMutation, ListTodosQuery } from "../API";
import { createTodo } from "../graphql/mutations";
import { listTodos } from "../graphql/queries";
import { GRAPHQL_AUTH_MODE } from "@aws-amplify/api";
import { Authenticator } from "@aws-amplify/ui-react";
import awsExports from "../aws-exports";
import { useRouter } from "next/router";
import '@aws-amplify/ui-react/styles.css';

Amplify.configure({ ...awsExports, ssr: true });


// index.tsx
export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const SSR = withSSRContext({ req });

  const response = (await SSR.API.graphql({
    query: listTodos,
    authMode: GRAPHQL_AUTH_MODE.API_KEY,
  })) as {
    auth;
    data: ListTodosQuery;
  };

  return {
    props: {
      todos: response.data.listTodos.items,
    },
  };
};


export default function Home({ todos = [] }: { todos: Todo[] }) {
  const router = useRouter()

  async function handleCreateTodo(event) {
    event.preventDefault();

    const form = new FormData(event.target);

    try {
      const createInput: CreateTodoInput = {
        name: form.get("title").toString(),
        description: form.get("content").toString(),
      };

      const request = (await API.graphql({
        authMode: GRAPHQL_AUTH_MODE.AMAZON_COGNITO_USER_POOLS,
        query: createTodo,
        variables: {
          input: createInput,
        },
      })) as { data: CreateTodoMutation; errors: any[] };

      router.push(`/todo/${request.data.createTodo.id}`)


    } catch ({ errors }) {
      console.error(...errors);
      throw new Error(errors[0].message);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {todos.map((todo) => (
          <a href={`/todo/${todo.id}`} key={todo.id}>
            <h3>{todo.name}</h3>
            <p>{todo.description}</p>
          </a>
        ))}
      </div>

      <Authenticator>
        <form onSubmit={handleCreateTodo}>
          <fieldset>
            <legend>Title</legend>
            <input defaultValue={`Today, ${new Date().toLocaleTimeString()}`} name="title" />
          </fieldset>

          <fieldset>
            <legend>Content</legend>
            <textarea defaultValue="I built an Amplify app with Next.js!" name="content" />
          </fieldset>

          <button>Create Todo</button>
        </form>
      </Authenticator>
    </div>
  );
}
