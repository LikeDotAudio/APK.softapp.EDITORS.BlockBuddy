// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/* The thirteen devices Block Buddy used to ship in its source. They live in
   the BIM library now (DATABASE.server.BIM); this copy is only the tests' fixture. */

export const BUILTIN_DEVICES = [
  // ==================== BENCH INSTRUMENT & DEVICE TEMPLATES ====================
  // Templates only. A device is "discovered" when the bus reports it (APKSoftapp.discovered
  // in blockBuddyApp.js), never because it is listed here.
  {
    id: 'dev_bench_34401a',
    name: 'Keysight_34401A',
    displayName: '34401A 6.5-Digit DMM',
    make: 'Keysight / Agilent',
    model: '34401A',
    kind: 'Test Instrument',
    ru: '2U Half-Rack',
    width: 280,
    height: 180,
    source: 'library',
    ports: [
      { id: 'INPUT_HI', label: 'Input HI (1000V)', side: 'left', dir: 'In', format: 'DC Low Voltage', connector: 'BNC', color: '#EF4444' },
      { id: 'INPUT_LO', label: 'Input LO (Common)', side: 'left', dir: 'In', format: 'DC Low Voltage', connector: 'BNC', color: '#3B82F6' },
      { id: 'SENSE_HI', label: 'Sense HI (4-Wire)', side: 'left', dir: 'In', format: 'DC Low Voltage', connector: 'BNC', color: '#EF4444' },
      { id: 'SENSE_LO', label: 'Sense LO (4-Wire)', side: 'left', dir: 'In', format: 'DC Low Voltage', connector: 'BNC', color: '#3B82F6' },
      { id: 'GPIB_BUS', label: 'IEEE-488 GPIB (:5)', side: 'right', dir: 'Bidi', format: 'RS-232 / 422', connector: 'DB-25', color: '#10B981' },
      { id: 'RS232_COM', label: 'RS-232 DTE Serial', side: 'right', dir: 'Bidi', format: 'RS-232 / 422', connector: 'DB-25', color: '#10B981' },
      { id: 'EXT_TRIG', label: 'Ext Trigger In', side: 'top', dir: 'In', format: 'GPIO', connector: 'BNC', color: '#F59E0B' },
      { id: 'VM_COMP', label: 'VM Complete Out', side: 'top', dir: 'Out', format: 'GPIO', connector: 'BNC', color: '#F59E0B' },
      { id: 'AC_POWER', label: 'AC Mains 120V 60Hz', side: 'bottom', dir: 'In', format: 'AC Mains 120/240V', connector: 'IEC', color: '#EF4444' }
    ]
  },
  {
    id: 'dev_bench_54641d',
    name: 'Agilent_54641D',
    displayName: '54641D Mixed-Signal Scope',
    make: 'Agilent / HP',
    model: '54641D',
    kind: 'Test Instrument',
    ru: '3U Bench',
    width: 300,
    height: 200,
    source: 'library',
    ports: [
      { id: 'CH1_ANALOG', label: 'Analog CH1 (350MHz)', side: 'left', dir: 'In', format: 'RF Coax', connector: 'BNC', color: '#EAB308' },
      { id: 'CH2_ANALOG', label: 'Analog CH2 (350MHz)', side: 'left', dir: 'In', format: 'RF Coax', connector: 'BNC', color: '#38BDF8' },
      { id: 'POD1_DIG_0_7', label: 'Digital Logic D0-D7', side: 'left', dir: 'In', format: 'GPIO', connector: 'DB-25', color: '#A855F7' },
      { id: 'POD2_DIG_8_15', label: 'Digital Logic D8-D15', side: 'left', dir: 'In', format: 'GPIO', connector: 'DB-25', color: '#A855F7' },
      { id: 'GPIB_IEEE488', label: 'IEEE-488 GPIB (:6)', side: 'right', dir: 'Bidi', format: 'RS-232 / 422', connector: 'DB-25', color: '#10B981' },
      { id: 'RS232_SERIAL', label: 'RS-232 Control', side: 'right', dir: 'Bidi', format: 'RS-232 / 422', connector: 'DB-25', color: '#10B981' },
      { id: 'EXT_TRIGGER', label: 'Ext Trigger In', side: 'top', dir: 'In', format: 'GPIO', connector: 'BNC', color: '#F59E0B' },
      { id: 'CAL_OUT', label: 'Probe Cal 1kHz 5V', side: 'top', dir: 'Out', format: 'DC Low Voltage', connector: 'BNC', color: '#F59E0B' },
      { id: 'AC_POWER', label: 'AC Mains 100-240V', side: 'bottom', dir: 'In', format: 'AC Mains 120/240V', connector: 'IEC', color: '#EF4444' }
    ]
  },
  {
    id: 'dev_bench_premo',
    name: 'Desk_preMO',
    displayName: 'Desk preMO Monitor Controller',
    make: 'APK Audio',
    model: 'preMO Mark II',
    kind: 'Audio DSP',
    ru: '2U Rackmount',
    width: 320,
    height: 240,
    source: 'library',
    ports: [
      { id: 'MIC_IN_1', label: 'Mic/Line 1 (Discrete)', side: 'left', dir: 'In', format: 'Analog Audio', connector: 'XLR-F', color: '#10B981' },
      { id: 'MIC_IN_2', label: 'Mic/Line 2 (Discrete)', side: 'left', dir: 'In', format: 'Analog Audio', connector: 'XLR-F', color: '#10B981' },
      { id: 'MIC_IN_3', label: 'Mic/Line 3 (Discrete)', side: 'left', dir: 'In', format: 'Analog Audio', connector: 'XLR-F', color: '#10B981' },
      { id: 'MIC_IN_4', label: 'Mic/Line 4 (Discrete)', side: 'left', dir: 'In', format: 'Analog Audio', connector: 'XLR-F', color: '#10B981' },
      { id: 'MON_SRC_A', label: 'Monitor Source A L/R', side: 'left', dir: 'In', format: 'Analog Audio', connector: 'TRS', color: '#10B981' },
      { id: 'MON_SRC_B', label: 'Monitor Source B L/R', side: 'left', dir: 'In', format: 'Analog Audio', connector: 'TRS', color: '#10B981' },
      { id: 'MON_MAIN_L', label: 'Main Speaker Left', side: 'right', dir: 'Out', format: 'Analog Audio', connector: 'XLR-M', color: '#10B981' },
      { id: 'MON_MAIN_R', label: 'Main Speaker Right', side: 'right', dir: 'Out', format: 'Analog Audio', connector: 'XLR-M', color: '#10B981' },
      { id: 'MON_ALT_L', label: 'Alt Speaker Left', side: 'right', dir: 'Out', format: 'Analog Audio', connector: 'XLR-M', color: '#10B981' },
      { id: 'MON_ALT_R', label: 'Alt Speaker Right', side: 'right', dir: 'Out', format: 'Analog Audio', connector: 'XLR-M', color: '#10B981' },
      { id: 'HP_OUT_1', label: 'Headphone 1 (Front)', side: 'right', dir: 'Out', format: 'Analog Audio', connector: 'TRS', color: '#10B981' },
      { id: 'HP_OUT_2', label: 'Headphone 2 (Front)', side: 'right', dir: 'Out', format: 'Analog Audio', connector: 'TRS', color: '#10B981' },
      { id: 'USB_AUDIO', label: 'USB 2.0 Audio 8x8', side: 'top', dir: 'Bidi', format: 'USB 3.0 / C', connector: 'USB-C', color: '#38BDF8' },
      { id: 'TALKBACK_SW', label: 'Talkback Remote Switch', side: 'top', dir: 'In', format: 'GPIO', connector: 'TRS', color: '#F59E0B' },
      { id: 'DC_PWR_IN', label: 'DC +24V Supply', side: 'bottom', dir: 'In', format: 'DC Low Voltage', connector: 'PowerCon', color: '#EF4444' }
    ]
  },
  {
    id: 'dev_bench_analog_9_16',
    name: 'Analog_inputs_9_16',
    displayName: 'Analog inputs 9-16 Converter',
    make: 'APK Audio / Focusrite',
    model: 'AI-8 Dante',
    kind: 'Stage Box',
    ru: '1U Rackmount',
    width: 280,
    height: 220,
    source: 'library',
    ports: [
      { id: 'ANALOG_IN_9', label: 'Analog Ch 9 Line In', side: 'left', dir: 'In', format: 'Analog Audio', connector: 'XLR-F', color: '#10B981' },
      { id: 'ANALOG_IN_10', label: 'Analog Ch 10 Line In', side: 'left', dir: 'In', format: 'Analog Audio', connector: 'XLR-F', color: '#10B981' },
      { id: 'ANALOG_IN_11', label: 'Analog Ch 11 Line In', side: 'left', dir: 'In', format: 'Analog Audio', connector: 'XLR-F', color: '#10B981' },
      { id: 'ANALOG_IN_12', label: 'Analog Ch 12 Line In', side: 'left', dir: 'In', format: 'Analog Audio', connector: 'XLR-F', color: '#10B981' },
      { id: 'ANALOG_IN_13', label: 'Analog Ch 13 Line In', side: 'left', dir: 'In', format: 'Analog Audio', connector: 'XLR-F', color: '#10B981' },
      { id: 'ANALOG_IN_14', label: 'Analog Ch 14 Line In', side: 'left', dir: 'In', format: 'Analog Audio', connector: 'XLR-F', color: '#10B981' },
      { id: 'ANALOG_IN_15', label: 'Analog Ch 15 Line In', side: 'left', dir: 'In', format: 'Analog Audio', connector: 'XLR-F', color: '#10B981' },
      { id: 'ANALOG_IN_16', label: 'Analog Ch 16 Line In', side: 'left', dir: 'In', format: 'Analog Audio', connector: 'XLR-F', color: '#10B981' },
      { id: 'DANTE_PRI', label: 'Dante Primary (1G)', side: 'right', dir: 'Out', format: 'Dante / AES67', connector: 'EtherCON', color: '#38BDF8' },
      { id: 'DANTE_SEC', label: 'Dante Secondary (Redun)', side: 'right', dir: 'Out', format: 'Dante / AES67', connector: 'EtherCON', color: '#38BDF8' },
      { id: 'WORD_CLOCK', label: 'WordClock Sync In', side: 'top', dir: 'In', format: 'WordClock', connector: 'BNC', color: '#F59E0B' },
      { id: 'AC_POWER', label: 'AC Mains 100-240V', side: 'bottom', dir: 'In', format: 'AC Mains 120/240V', connector: 'IEC', color: '#EF4444' }
    ]
  },
  {
    id: 'dev_bench_appletv',
    name: 'Apple_TV_HD_4th_gen',
    displayName: 'Apple TV HD (4th gen)',
    make: 'Apple',
    model: 'A1625',
    kind: 'Source / Player',
    ru: 'Desktop',
    width: 240,
    height: 140,
    source: 'library',
    ports: [
      { id: 'NET_ETH', label: '10/100BASE-T Ethernet', side: 'left', dir: 'Bidi', format: 'Gigabit PoE+', connector: 'RJ45', color: '#38BDF8' },
      { id: 'HDMI_OUT', label: 'HDMI 1.4b (1080p60)', side: 'right', dir: 'Out', format: 'HDMI 2.1', connector: 'HDMI', color: '#A855F7' },
      { id: 'WIFI_AIRPLAY', label: 'AirPlay 2 MIMO 802.11ac', side: 'top', dir: 'In', format: 'RF Coax', connector: 'Blank', color: '#F59E0B' },
      { id: 'AC_MAINS', label: 'AC Mains (C7 2-Prong)', side: 'bottom', dir: 'In', format: 'AC Mains 120/240V', connector: 'IEC', color: '#EF4444' }
    ]
  },
  {
    id: 'dev_bench_chromecast_audio',
    name: 'Chromecast_Audio',
    displayName: 'Chromecast Audio Receiver',
    make: 'Google',
    model: 'RUX-J42',
    kind: 'Source / Player',
    ru: 'Puck',
    width: 220,
    height: 130,
    source: 'library',
    ports: [
      { id: 'WIFI_CAST', label: 'WiFi 802.11ac (2.4/5GHz)', side: 'left', dir: 'In', format: 'RF Coax', connector: 'Blank', color: '#38BDF8' },
      { id: 'AUDIO_ANALOG', label: '3.5mm Stereo Analog Out', side: 'right', dir: 'Out', format: 'Analog Audio', connector: 'TRS', color: '#10B981' },
      { id: 'AUDIO_OPTICAL', label: 'Mini-TOSLINK 24/96 Digital', side: 'right', dir: 'Out', format: 'AES3', connector: 'OpticalCON', color: '#38BDF8' },
      { id: 'USB_5V_PWR', label: 'Micro-USB 5V 1A DC', side: 'bottom', dir: 'In', format: 'DC Low Voltage', connector: 'USB-C', color: '#EF4444' }
    ]
  },
  {
    id: 'dev_bench_8903b',
    name: 'HP_8903B',
    displayName: '8903B Audio Analyzer',
    make: 'Hewlett-Packard',
    model: '8903B',
    kind: 'Test Instrument',
    ru: '3U Bench',
    width: 280,
    height: 170,
    source: 'library',
    ports: [
      { id: 'INPUT_HI', label: 'Analyzer Input HI (Differential)', side: 'left', dir: 'In', format: 'Analog Audio', connector: 'BNC', color: '#10B981' },
      { id: 'INPUT_LO', label: 'Analyzer Input LO (Differential)', side: 'left', dir: 'In', format: 'Analog Audio', connector: 'BNC', color: '#10B981' },
      { id: 'OSC_OUT_HI', label: 'Oscillator Output HI (600Ω/50Ω)', side: 'right', dir: 'Out', format: 'Analog Audio', connector: 'BNC', color: '#10B981' },
      { id: 'OSC_OUT_LO', label: 'Oscillator Output LO (600Ω/50Ω)', side: 'right', dir: 'Out', format: 'Analog Audio', connector: 'BNC', color: '#10B981' },
      { id: 'MONITOR_OUT', label: 'Distortion / Monitor Out', side: 'right', dir: 'Out', format: 'Analog Audio', connector: 'BNC', color: '#F59E0B' },
      { id: 'GPIB_IEEE488', label: 'IEEE-488 GPIB Bus', side: 'top', dir: 'Bidi', format: 'RS-232 / 422', connector: 'DB-25', color: '#10B981' },
      { id: 'AC_POWER', label: 'AC Mains 120/240V', side: 'bottom', dir: 'In', format: 'AC Mains 120/240V', connector: 'IEC', color: '#EF4444' }
    ]
  },

  // ==================== PRO AV / IT LIBRARY HARDWARE ====================
  {
    id: 'dev_qsys_core110f',
    name: 'QSYS_Core_110f',
    displayName: 'Q-SYS Core 110f DSP',
    make: 'QSC',
    model: 'Core 110f',
    kind: 'Audio DSP',
    ru: '1U Rackmount',
    width: 320,
    height: 240,
    source: 'library',
    ports: [
      { id: 'MIC_IN_1_4', label: 'Mic/Line In 1-4 (+48V)', side: 'left', dir: 'In', format: 'Analog Audio', connector: 'Terminal-Block', color: '#10B981' },
      { id: 'MIC_IN_5_8', label: 'Mic/Line In 5-8 (+48V)', side: 'left', dir: 'In', format: 'Analog Audio', connector: 'Terminal-Block', color: '#10B981' },
      { id: 'FLEX_IN_1_4', label: 'Flex I/O 1-4 (Inputs)', side: 'left', dir: 'In', format: 'Analog Audio', connector: 'Terminal-Block', color: '#10B981' },
      { id: 'LINE_OUT_1_4', label: 'Analog Line Out 1-4', side: 'right', dir: 'Out', format: 'Analog Audio', connector: 'Terminal-Block', color: '#10B981' },
      { id: 'LINE_OUT_5_8', label: 'Analog Line Out 5-8', side: 'right', dir: 'Out', format: 'Analog Audio', connector: 'Terminal-Block', color: '#10B981' },
      { id: 'FLEX_OUT_5_8', label: 'Flex I/O 5-8 (Outputs)', side: 'right', dir: 'Out', format: 'Analog Audio', connector: 'Terminal-Block', color: '#10B981' },
      { id: 'LAN_A_PRI', label: 'LAN A Q-LAN / AES67 Pri', side: 'top', dir: 'Bidi', format: 'Dante / AES67', connector: 'RJ45', color: '#38BDF8' },
      { id: 'LAN_B_AUX', label: 'LAN B Q-LAN / Redundancy', side: 'top', dir: 'Bidi', format: 'Dante / AES67', connector: 'RJ45', color: '#38BDF8' },
      { id: 'RS232_PORT', label: 'RS-232 Control Port', side: 'top', dir: 'Bidi', format: 'RS-232 / 422', connector: 'Terminal-Block', color: '#F59E0B' },
      { id: 'GPIO_8CH', label: 'GPIO 8 Logic Pins', side: 'top', dir: 'Bidi', format: 'GPIO', connector: 'Terminal-Block', color: '#F59E0B' },
      { id: 'USB_AUDIO_DEV', label: 'USB Audio B (16x16)', side: 'top', dir: 'Bidi', format: 'USB 3.0 / C', connector: 'USB-C', color: '#38BDF8' },
      { id: 'AC_MAINS', label: 'AC Mains 100-240V IEC', side: 'bottom', dir: 'In', format: 'AC Mains 120/240V', connector: 'IEC', color: '#EF4444' }
    ]
  },
  {
    id: 'dev_netgear_m4250_24g2f',
    name: 'Netgear_M4250_24G2F',
    displayName: 'Netgear M4250-24G2F PoE+',
    make: 'Netgear AV',
    model: 'GSM4226PX',
    kind: 'Network Switch',
    ru: '1U Rackmount',
    width: 320,
    height: 220,
    source: 'library',
    ports: [
      { id: 'POE_P1_8', label: 'Ports 1-8 1G PoE+ (30W)', side: 'left', dir: 'Bidi', format: 'Gigabit PoE+', connector: 'EtherCON', color: '#38BDF8' },
      { id: 'POE_P9_16', label: 'Ports 9-16 1G PoE+ (30W)', side: 'left', dir: 'Bidi', format: 'Gigabit PoE+', connector: 'EtherCON', color: '#38BDF8' },
      { id: 'POE_P17_24', label: 'Ports 17-24 1G PoE+ (30W)', side: 'right', dir: 'Bidi', format: 'Gigabit PoE+', connector: 'RJ45', color: '#38BDF8' },
      { id: 'UPLINK_SFP_25', label: 'SFP+ 10G Uplink 25', side: 'right', dir: 'Bidi', format: '10GbE SFP+', connector: 'OpticalCON', color: '#A855F7' },
      { id: 'UPLINK_SFP_26', label: 'SFP+ 10G Uplink 26', side: 'right', dir: 'Bidi', format: '10GbE SFP+', connector: 'OpticalCON', color: '#A855F7' },
      { id: 'OOBM_MGMT', label: 'OOBM Mgmt Gigabit', side: 'top', dir: 'Bidi', format: 'Gigabit PoE+', connector: 'RJ45', color: '#F59E0B' },
      { id: 'CONSOLE_USB', label: 'Console USB-C / RJ45', side: 'top', dir: 'Bidi', format: 'RS-232 / 422', connector: 'USB-C', color: '#F59E0B' },
      { id: 'AC_POWER_IEC', label: 'AC Mains 100-240V 400W', side: 'bottom', dir: 'In', format: 'AC Mains 120/240V', connector: 'IEC', color: '#EF4444' }
    ]
  },
  {
    id: 'dev_blackmagic_atem_4k',
    name: 'Blackmagic_ATEM_4K',
    displayName: 'ATEM TV Studio 4K',
    make: 'Blackmagic Design',
    model: 'ATEM TV Studio 4K',
    kind: 'Video Matrix',
    ru: '1U Rackmount',
    width: 340,
    height: 240,
    source: 'library',
    ports: [
      { id: 'SDI_IN_1_4', label: '12G-SDI Inputs 1-4', side: 'left', dir: 'In', format: '12G-SDI', connector: 'BNC', color: '#A855F7' },
      { id: 'SDI_IN_5_8', label: '12G-SDI Inputs 5-8', side: 'left', dir: 'In', format: '12G-SDI', connector: 'BNC', color: '#A855F7' },
      { id: 'AUDIO_XLR_IN', label: 'Analog Audio In L/R', side: 'left', dir: 'In', format: 'Analog Audio', connector: 'XLR-F', color: '#10B981' },
      { id: 'SDI_PGM_OUT', label: '12G-SDI Program Out 1/2', side: 'right', dir: 'Out', format: '12G-SDI', connector: 'BNC', color: '#A855F7' },
      { id: 'SDI_AUX_OUT', label: '12G-SDI Aux Output', side: 'right', dir: 'Out', format: '12G-SDI', connector: 'BNC', color: '#A855F7' },
      { id: 'HDMI_MV_OUT', label: 'HDMI Multiview (4K/HD)', side: 'right', dir: 'Out', format: 'HDMI 2.1', connector: 'HDMI', color: '#A855F7' },
      { id: 'AUDIO_XLR_OUT', label: 'Analog Audio PGM Out L/R', side: 'right', dir: 'Out', format: 'Analog Audio', connector: 'XLR-M', color: '#10B981' },
      { id: 'ETHERNET_SW', label: 'Ethernet Control & Panel', side: 'top', dir: 'Bidi', format: 'Gigabit PoE+', connector: 'RJ45', color: '#38BDF8' },
      { id: 'REF_GENLOCK', label: 'Blackburst / Tri-Level In', side: 'top', dir: 'In', format: 'WordClock', connector: 'BNC', color: '#F59E0B' },
      { id: 'AC_POWER', label: 'AC Mains 100-240V IEC', side: 'bottom', dir: 'In', format: 'AC Mains 120/240V', connector: 'IEC', color: '#EF4444' }
    ]
  },
  {
    id: 'dev_yamaha_tio1608d',
    name: 'Yamaha_Tio1608_D',
    displayName: 'Tio1608-D Stage Box',
    make: 'Yamaha',
    model: 'Tio1608-D',
    kind: 'Stage Box',
    ru: '2U Rackmount',
    width: 320,
    height: 240,
    source: 'library',
    ports: [
      { id: 'IN_1_4', label: 'Mic/Line In 1-4 (+48V)', side: 'left', dir: 'In', format: 'Analog Audio', connector: 'XLR-F', color: '#10B981' },
      { id: 'IN_5_8', label: 'Mic/Line In 5-8 (+48V)', side: 'left', dir: 'In', format: 'Analog Audio', connector: 'XLR-F', color: '#10B981' },
      { id: 'IN_9_12', label: 'Mic/Line In 9-12 (+48V)', side: 'left', dir: 'In', format: 'Analog Audio', connector: 'XLR-F', color: '#10B981' },
      { id: 'IN_13_16', label: 'Mic/Line In 13-16 (+48V)', side: 'left', dir: 'In', format: 'Analog Audio', connector: 'XLR-F', color: '#10B981' },
      { id: 'OUT_1_4', label: 'Line Out 1-4 (DA)', side: 'right', dir: 'Out', format: 'Analog Audio', connector: 'XLR-M', color: '#10B981' },
      { id: 'OUT_5_8', label: 'Line Out 5-8 (DA)', side: 'right', dir: 'Out', format: 'Analog Audio', connector: 'XLR-M', color: '#10B981' },
      { id: 'DANTE_PRI', label: 'Dante Primary etherCON', side: 'top', dir: 'Bidi', format: 'Dante / AES67', connector: 'EtherCON', color: '#38BDF8' },
      { id: 'DANTE_SEC', label: 'Dante Secondary etherCON', side: 'top', dir: 'Bidi', format: 'Dante / AES67', connector: 'EtherCON', color: '#38BDF8' },
      { id: 'AC_POWER', label: 'AC Mains 100-240V IEC', side: 'bottom', dir: 'In', format: 'AC Mains 120/240V', connector: 'IEC', color: '#EF4444' }
    ]
  },
  {
    id: 'dev_shure_ulxd4d',
    name: 'Shure_ULXD4D',
    displayName: 'ULXD4D Dual Wireless Rx',
    make: 'Shure',
    model: 'ULXD4D',
    kind: 'Wireless Mic Rx',
    ru: '1U Rackmount',
    width: 300,
    height: 190,
    source: 'library',
    ports: [
      { id: 'ANT_A_RF', label: 'RF Antenna A In (50Ω BNC)', side: 'left', dir: 'In', format: 'RF Coax', connector: 'BNC', color: '#F59E0B' },
      { id: 'ANT_B_RF', label: 'RF Antenna B In (50Ω BNC)', side: 'left', dir: 'In', format: 'RF Coax', connector: 'BNC', color: '#F59E0B' },
      { id: 'AUDIO_CH1_XLR', label: 'Ch 1 Bal Audio Out (XLR)', side: 'right', dir: 'Out', format: 'Analog Audio', connector: 'XLR-M', color: '#10B981' },
      { id: 'AUDIO_CH2_XLR', label: 'Ch 2 Bal Audio Out (XLR)', side: 'right', dir: 'Out', format: 'Analog Audio', connector: 'XLR-M', color: '#10B981' },
      { id: 'DANTE_PRI', label: 'Dante Primary Network', side: 'top', dir: 'Bidi', format: 'Dante / AES67', connector: 'RJ45', color: '#38BDF8' },
      { id: 'DANTE_SEC', label: 'Dante Secondary Network', side: 'top', dir: 'Bidi', format: 'Dante / AES67', connector: 'RJ45', color: '#38BDF8' },
      { id: 'CASCADE_A', label: 'RF Cascade A Thru (BNC)', side: 'bottom', dir: 'Out', format: 'RF Coax', connector: 'BNC', color: '#F59E0B' },
      { id: 'CASCADE_B', label: 'RF Cascade B Thru (BNC)', side: 'bottom', dir: 'Out', format: 'RF Coax', connector: 'BNC', color: '#F59E0B' },
      { id: 'AC_POWER', label: 'AC Mains 100-240V IEC', side: 'bottom', dir: 'In', format: 'AC Mains 120/240V', connector: 'IEC', color: '#EF4444' }
    ]
  },
  {
    id: 'dev_powersoft_quattrocanali',
    name: 'Powersoft_Quattrocanali_4804',
    displayName: 'Quattrocanali 4804 DSP+D',
    make: 'Powersoft',
    model: 'Quattrocanali 4804 DSP+D',
    kind: 'Power Amplifier',
    ru: '1U Rackmount',
    width: 320,
    height: 200,
    source: 'library',
    ports: [
      { id: 'ANALOG_IN_1_2', label: 'Analog Inputs 1 & 2', side: 'left', dir: 'In', format: 'Analog Audio', connector: 'Terminal-Block', color: '#10B981' },
      { id: 'ANALOG_IN_3_4', label: 'Analog Inputs 3 & 4', side: 'left', dir: 'In', format: 'Analog Audio', connector: 'Terminal-Block', color: '#10B981' },
      { id: 'DANTE_AES67', label: 'Dante / AES67 2-In', side: 'left', dir: 'In', format: 'Dante / AES67', connector: 'RJ45', color: '#38BDF8' },
      { id: 'SPK_OUT_1', label: 'Speaker Output 1 (1200W)', side: 'right', dir: 'Out', format: 'Analog Audio', connector: 'Speakon', color: '#EF4444' },
      { id: 'SPK_OUT_2', label: 'Speaker Output 2 (1200W)', side: 'right', dir: 'Out', format: 'Analog Audio', connector: 'Speakon', color: '#EF4444' },
      { id: 'SPK_OUT_3', label: 'Speaker Output 3 (1200W)', side: 'right', dir: 'Out', format: 'Analog Audio', connector: 'Speakon', color: '#EF4444' },
      { id: 'SPK_OUT_4', label: 'Speaker Output 4 (1200W)', side: 'right', dir: 'Out', format: 'Analog Audio', connector: 'Speakon', color: '#EF4444' },
      { id: 'RS485_CTRL', label: 'RS485 / ArmoníaPlus Net', side: 'top', dir: 'Bidi', format: 'RS-232 / 422', connector: 'RJ45', color: '#F59E0B' },
      { id: 'GPIO_ALARM', label: 'Fault Alarm / Standby GPIO', side: 'top', dir: 'Bidi', format: 'GPIO', connector: 'Terminal-Block', color: '#F59E0B' },
      { id: 'POWERCON_AC', label: 'PowerCON TRUE1 20A AC', side: 'bottom', dir: 'In', format: 'AC Mains 120/240V', connector: 'PowerCon', color: '#EF4444' }
    ]
  }
];
