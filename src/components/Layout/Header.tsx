import { JSX } from 'react';
import { Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const Root = styled('header')(({ theme }) => ({
  position: 'relative',
  height: '80vh',
  textAlign: 'center',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  marginBottom: theme.spacing(20),
}));

export default function Header(): JSX.Element {
  return (
    <Root>
      <Typography variant='h1'>Explore</Typography>
    </Root>
  );
}
