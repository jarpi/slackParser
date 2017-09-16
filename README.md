### Slack Data retriever / parser

The aim of this project is to retrieve and parse slack events.
Right now, it only retrieves accessLogs for users from slack
and writes it to a file, this file is rotated every hour.

Another microservice, has the responsibility of writing all this
data to a Mongodb database in order for third party apps
consumeit

Cloning the projects:

```
git clone https://github.com/jarpi/slackCrawler.git

git clone https://github.com/jarpi/slackParser.git
```

Running:
```
# Build the project images
sudo docker build -t statustoday/slackparser SLACK_CRAWLER_DIR
sudo docker build -t statustoday/slackcrawler SLACK_PARSER_DIR

# Run the 3 services
From SLACK_PARSER_DIR
sudo TOKEN=YOUR_SLACK_TOKEN docker-compose up
```

# TODO
- Add logging
- Better logs
- Find a better way to handle write to disk
- Ask PO for the behavior when rotating files
- Refactor code
- Add tests
- Gulpify / Gruntify project (dev/production)
- Add more events from slack
- Fix lint issues
- Deploy to server
- Add way to track transaction and retrieve from a frontend


author: @jarpi

Feel free to open issues, comment code or requesting changes.
Software is alive, let's feed it!
