FROM node:18-alpine

RUN mkdir /app
WORKDIR /app
ADD . /app
ADD package.json /app
ADD package-lock.json /app

RUN npm install && npm run build

EXPOSE 3000
ENTRYPOINT ["npm", "run", "bot"]
