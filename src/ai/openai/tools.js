exports.tools = [
  {
    type: "function",
    function: {
      name: "searchFlights",
      description: "Search flights between two cities",
      parameters: {
        type: "object",
        properties: {
          from: {
            type: "string",
            description: "Departure airport code",
          },
          to: {
            type: "string",
            description: "Arrival airport code",
          },
          departureDate: {
            type: "string",
            description: "Departure date",
          },
        },
        required: ["from", "to"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "searchHotels",
      description: "Search hotels in a city",
      parameters: {
        type: "object",
        properties: {
          city: {
            type: "string",
          },
          checkIn: {
            type: "string",
          },
          checkOut: {
            type: "string",
          },
        },
        required: ["city"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "planTrip",
      description: "Generate travel itinerary",
      parameters: {
        type: "object",
        properties: {
          destination: {
            type: "string",
          },
          days: {
            type: "number",
          },
          budget: {
            type: "number",
          },
        },
        required: ["destination"],
      },
    },
  },
];