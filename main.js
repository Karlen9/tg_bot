import moment from "moment";
import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import pkg from "@prisma/client";
import uuid4 from "uuid4";
import { equal } from "node:assert/strict";
const { PrismaClient } = pkg;
dotenv.config();

const prisma = new PrismaClient();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const date = moment().format("MMMM Do, h:mm");

const setEnterTimeOptions = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [{ text: "Записать время входа", callback_data: "Время входа в офис" }],
    ],
  }),
};

const setExitTimeOptions = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [
        {
          text: "Записать время выхода",
          callback_data: "Время выхода из офиса",
        },
      ],
    ],
  }),
};

const currentTimeOption = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [{ text: "Указать текущее время", callback_data: "current_time" }],
    ],
  }),
};

const addStartTime = () => {
  console.log(date);
};

const start = async () => {
  // let users = await User.findAll({ chatId });
  // console.log("users", users);

  try {
  } catch (error) {
    console.log("Ошибка при подключении к Базе Данных ", error);
  }
  bot.on("message", async (msg) => {
    const fName = msg.from.first_name;

    const newUser = await prisma.user.create({
      data: {
        first_name: fName,
        last_name: msg.from.last_name,
        id: uuid4(),
      },
    });
    const chatId = msg.chat.id;
    const text = msg.text;
    const commands = [
      {
        command: "/start",
        description: "Начальное приветствие",
      },
      { command: "/enter", description: "Указать время входа" },
      { command: "/exit", description: "Указать время выхода" },
      { command: "/info", description: "Получить информацию о себе" },
      { command: "/date", description: "Дата сегодня" },
    ];

    try {
      let enterance;
      let quit;
      let session;
      if (text === "/start") {
        return bot.sendMessage(
          chatId,
          `Добро пожаловать, ${newUser.first_name}!`
        );
      } else if (text === "/info") {
        // const users = await prisma.user.findUnique({
        //   where: { UserWhereUniqueInput: { id: newUser.id } },
        // });

        const user = await prisma.user.findMany({
          where: { first_name: { equals: "Карлен" } },
        });
        await bot.sendMessage(
          chatId,
          `Тебя зовут: ${msg.from.first_name ? msg.from.first_name : ""} ${
            msg.from.last_name ? msg.from.last_name : ""
          }, твой id: ${msg.from.id}, ${user[0]?.created_at}`
        );
      } else if (text === "/date") {
        return await bot.sendMessage(chatId, `Сегодня: ${date} `);
      } else if (text === "/enter") {
        enterance = await prisma.enter.create({
          data: {
            id: uuid4(),
            author: { connect: { id: newUser?.id } },
            created_at: new Date(),
          },
        });

        bot.sendMessage(
          chatId,
          `Вы зашли в офис в ${
            enterance.created_at.getHours() < 10
              ? "0" + enterance.created_at.getHours()
              : enterance.created_at.getHours()
          }:${
            enterance.created_at.getMinutes() < 10
              ? "0" + enterance.created_at.getMinutes()
              : enterance.created_at.getMinutes()
          }`
        );
      } else if (text === "/exit") {
        quit = await prisma.quit.create({
          data: {
            id: uuid4(),
            author: { connect: { id: newUser?.id } },
            created_at: new Date(),
          },
        });

        session = await prisma.session.create({
          data: {
            id: uuid4(),
            author: { connect: { id: newUser?.id } },
            duration: "10 минут",
          },
        });

        bot.sendMessage(
          chatId,
          `Вы вышли из офиса в ${
            quit.created_at.getHours() < 10
              ? "0" + quit.created_at.getHours()
              : quit.created_at.getHours()
          }:${
            quit.created_at.getMinutes() < 10
              ? "0" + quit.created_at.getMinutes()
              : quit.created_at.getMinutes()
          } Время в офисе ${session.duration}`
        );
      } else if (text === "Привет") {
        return bot.sendMessage(chatId, `Привет, ${msg.from.first_name}`);
      } else if (text === "/recs") {
        const enters = await prisma.enter.findMany({
          select: { author: true },
        });
        const quits = await prisma.quit.findMany({
          select: { author: true },
        });
        const records = [...enters, ...quits];
        console.log(records);
        bot.sendMessage(chatId, `blabla ${records}`);
      } else {
        return bot.sendMessage(
          chatId,
          `Привет, ты написал мне: '${text}', напиши какую-нибудь команду...`
        );
      }
    } catch (error) {
      bot.sendMessage(chatId, "Произошла ошибка...");
      console.log(error);
    }

    bot.setMyCommands(commands);
    console.log("Сообщение: ", text, ". От ", msg.from.first_name);
  });

  bot.on("callback_query", (callbackQuery) => {
    const action = callbackQuery.data;

    if (action === "current_time") {
      console.log("Current", date);
    }
  });
};

start();
